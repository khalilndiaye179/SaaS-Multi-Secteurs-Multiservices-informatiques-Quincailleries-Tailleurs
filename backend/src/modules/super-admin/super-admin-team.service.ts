import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from './audit-log.service';
import { EmailService } from '../notifications/email.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { CreateCollaboratorDto, UpdateCollaboratorRoleDto } from './dto/super-admin-team.dto';

@Injectable()
export class SuperAdminTeamService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
    private emailService: EmailService,
  ) {}

  /**
   * Création directe d'un collaborateur Super Admin
   */
  async createCollaborator(dto: CreateCollaboratorDto) {
    const store = TenantContextService.getStore();
    if (!store?.isSuperAdmin) throw new ForbiddenException('Accès réservé au Super Admin.');

    const normalizedEmail = dto.email.toLowerCase().trim();

    // 🔒 SÉCURITÉ : Vérification de l'inexistence d'un utilisateur actif
    const existingUser = await this.prisma.withoutTenantScope(async (c) =>
      c.user.findFirst({ where: { email: normalizedEmail } }),
    );
    if (existingUser) {
      throw new ConflictException('Un compte utilisateur avec cet email existe déjà sur la plateforme.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.withoutTenantScope(async (tx) => {
        let role = await tx.role.findFirst({ where: { name: dto.roleName, tenantId: null } });
        if (!role) {
          role = await tx.role.create({
            data: { name: dto.roleName, description: `Rôle système Super Admin ${dto.roleName}` },
          });
        }

        let systemTenant = await tx.tenant.findFirst({ where: { code: 'SAAS-GLOBAL' } });
        if (!systemTenant) {
          systemTenant = await tx.tenant.create({
            data: {
              code: 'SAAS-GLOBAL',
              name: 'KPSyDesk System Console',
              sectorType: 'MULTISERVICES_IT',
              billingStatus: 'ACTIVE',
              isPermanentDemo: true,
              isDemo: true
            },
          });
        }

        const username = `SAAS-${Date.now().toString().substring(7)}`;

        const newUser = await tx.user.create({
          data: {
            tenantId: systemTenant.id,
            username,
            fullName: dto.fullName,
            email: normalizedEmail,
            phone: dto.phone,
            passwordHash,
            isActive: true,
            mustChangePassword: true, // Force password change on first login
            userRoles: {
              create: { roleId: role.id },
            },
          },
        });

        await this.auditLogService.record({
          action: 'SUPER_ADMIN_COLLABORATOR_CREATED',
          resourceType: 'USER',
          resourceId: newUser.id,
          result: 'SUCCESS',
          metadata: { email: newUser.email, roleName: dto.roleName },
        });

        // Envoi de l'email
        const loginLink = `https://doorwaar.kpsyinformatique.com`;
        await this.emailService.sendEmail(
          normalizedEmail,
          'Bienvenue dans l\'équipe Super Admin - KPSyDesk',
          `Bonjour ${dto.fullName},\n\nVous avez été ajouté à l'équipe Super Admin avec le rôle ${dto.roleName}.\n\nVos accès :\nEmail : ${normalizedEmail}\nMot de passe par défaut : ${dto.password}\n\nLien de connexion : ${loginLink}\n\nLors de votre première connexion, il vous sera demandé de modifier votre mot de passe et de configurer le 2FA.`,
          `<p>Bonjour ${dto.fullName},</p><p>Vous avez été ajouté à l'équipe Super Admin de Door Waar avec le rôle <b>${dto.roleName}</b>.</p><p>Vos accès de connexion :</p><ul><li>Email : <b>${normalizedEmail}</b></li><li>Mot de passe par défaut : <b>${dto.password}</b></li></ul><p><a href="${loginLink}" style="padding: 10px 20px; background-color: #312E81; color: white; text-decoration: none; border-radius: 5px;">Se connecter à la console</a></p><p>Lors de votre première connexion, pour des raisons de sécurité, vous devrez impérativement définir un nouveau mot de passe et configurer l'authentification à double facteur (TOTP).</p>`
        );

        return {
          success: true,
          message: 'Collaborateur créé avec succès !',
          userId: newUser.id,
          email: newUser.email,
        };
    });
  }

  /**
   * Modification sécurisée de rôle avec PROTECTION DU DERNIER SUPER ADMIN
   */
  async updateRole(targetUserId: string, dto: UpdateCollaboratorRoleDto) {
    const store = TenantContextService.getStore();
    if (!store?.isSuperAdmin) throw new ForbiddenException('Accès réservé au Super Admin.');

    const targetUser = await this.prisma.withoutTenantScope(async (c) =>
      c.user.findUnique({ where: { id: targetUserId }, include: { userRoles: { include: { role: true } } } }),
    );

    if (!targetUser) throw new NotFoundException('Collaborateur introuvable.');

    const isCurrentlySuperAdmin = targetUser.userRoles.some((ur) => ur.role.name === 'SUPER_ADMIN');

    // 🔒 PROTECTION CRITIQUE DU DERNIER SUPER ADMIN
    if (isCurrentlySuperAdmin && dto.roleName !== 'SUPER_ADMIN') {
      const superAdminCount = await this.prisma.withoutTenantScope(async (c) =>
        c.userRole.count({ where: { role: { name: 'SUPER_ADMIN' } } }),
      );

      if (superAdminCount <= 1) {
        throw new ConflictException('Impossible de modifier le rôle du dernier SUPER_ADMIN actif de la plateforme.');
      }
    }

    let newRole = await this.prisma.withoutTenantScope(async (c) =>
      c.role.findFirst({ where: { name: dto.roleName, tenantId: null } }),
    );

    if (!newRole) {
      newRole = await this.prisma.withoutTenantScope(async (c) =>
        c.role.create({ data: { name: dto.roleName, description: `Rôle ${dto.roleName}` } }),
      );
    }

    await this.prisma.withoutTenantScope(async (c) => {
      await c.userRole.deleteMany({ where: { userId: targetUserId } });
      return c.userRole.create({ data: { userId: targetUserId, roleId: newRole.id } });
    });

    await this.auditLogService.record({
      action: 'SUPER_ADMIN_ROLE_CHANGED',
      resourceType: 'USER',
      resourceId: targetUserId,
      result: 'SUCCESS',
      metadata: { newRoleName: dto.roleName },
    });

    return { success: true, message: `Rôle mis à jour vers ${dto.roleName}` };
  }

  /**
   * Désactivation sécurisée avec PROTECTION DU DERNIER SUPER ADMIN
   */
  async toggleStatus(targetUserId: string, isActive: boolean) {
    const store = TenantContextService.getStore();
    if (!store?.isSuperAdmin) throw new ForbiddenException('Accès réservé au Super Admin.');

    if (store.userId === targetUserId && !isActive) {
      throw new ForbiddenException('Vous ne pouvez pas désactiver votre propre compte d\'administration.');
    }

    if (!isActive) {
      const isSuperAdmin = await this.prisma.withoutTenantScope(async (c) =>
        c.userRole.findFirst({ where: { userId: targetUserId, role: { name: 'SUPER_ADMIN' } } }),
      );

      if (isSuperAdmin) {
        const activeSuperAdminCount = await this.prisma.withoutTenantScope(async (c) =>
          c.user.count({ where: { isActive: true, userRoles: { some: { role: { name: 'SUPER_ADMIN' } } } } }),
        );

        if (activeSuperAdminCount <= 1) {
          throw new ConflictException('Impossible de désactiver le dernier SUPER_ADMIN actif de la plateforme.');
        }
      }
    }

    const updated = await this.prisma.withoutTenantScope(async (c) =>
      c.user.update({ where: { id: targetUserId }, data: { isActive } }),
    );

    await this.auditLogService.record({
      action: isActive ? 'SUPER_ADMIN_USER_ENABLED' : 'SUPER_ADMIN_USER_DISABLED',
      resourceType: 'USER',
      resourceId: targetUserId,
      result: 'SUCCESS',
    });

    return { success: true, isActive: updated.isActive };
  }

  /**
   * Liste des collaborateurs et des invitations en attente
   */
  async getTeamOverview() {
    const [users, invitations] = await this.prisma.withoutTenantScope(async (c) =>
      Promise.all([
        c.user.findMany({
          where: { tenant: { code: 'SAAS-GLOBAL' } },
          include: { userRoles: { include: { role: true } } },
          orderBy: { createdAt: 'desc' },
        }),
        c.superAdminInvitation.findMany({
          orderBy: { createdAt: 'desc' },
        }),
      ]),
    );

    const team = users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      isActive: u.isActive,
      roles: u.userRoles.map((ur) => ur.role.name),
      createdAt: u.createdAt,
      totpEnabled: u.totpEnabled,
    }));

    return { team, invitations };
  }

  /**
   * Réinitialisation forcée du mot de passe par le Super Admin
   */
  async forceResetPassword(targetUserId: string) {
    const store = TenantContextService.getStore();
    if (!store?.isSuperAdmin) throw new ForbiddenException('Accès réservé au Super Admin.');

    const targetUser = await this.prisma.withoutTenantScope(async (c) =>
      c.user.findUnique({ where: { id: targetUserId }, include: { tenant: true } })
    );

    if (!targetUser) throw new NotFoundException('Collaborateur introuvable.');

    // Only allow for system collaborators or maybe any user? The route is super-admin/team, so it's probably just for team.
    // We will allow it for team members for now.
    if (targetUser.tenant.code !== 'SAAS-GLOBAL') {
      throw new ForbiddenException('Cette action est réservée aux membres de l\'équipe système.');
    }

    // Generate random password
    const newPassword = crypto.randomBytes(6).toString('hex');

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.withoutTenantScope(async (c) =>
      c.user.update({
        where: { id: targetUserId },
        data: {
          passwordHash,
          mustChangePassword: true,
        },
      })
    );

    await this.auditLogService.record({
      action: 'SUPER_ADMIN_PASSWORD_RESET',
      resourceType: 'USER',
      resourceId: targetUserId,
      result: 'SUCCESS',
      metadata: { targetEmail: targetUser.email }
    });

    return {
      success: true,
      message: 'Mot de passe réinitialisé avec succès.',
      newPassword, // We return it in clear so the admin can copy it
    };
  }

  async disable2fa(targetUserId: string) {
    const store = TenantContextService.getStore();
    if (!store?.isSuperAdmin) throw new ForbiddenException('Accès réservé au Super Admin.');

    const targetUser = await this.prisma.withoutTenantScope(async (c) =>
      c.user.findUnique({ where: { id: targetUserId }, include: { tenant: true } })
    );

    if (!targetUser) throw new NotFoundException('Collaborateur introuvable.');

    if (targetUser.tenant.code !== 'SAAS-GLOBAL') {
      throw new ForbiddenException('Cette action est réservée aux membres de l\'équipe système.');
    }

    await this.prisma.withoutTenantScope(async (c) =>
      c.user.update({
        where: { id: targetUserId },
        data: {
          totpEnabled: false,
          totpSecret: null,
          totpBackupCodesHashed: [],
          totpFailedAttempts: 0,
          totpSessionId: null,
        }
      })
    );

    await this.auditLogService.record({
      action: 'ADMIN_2FA_DISABLED',
      resourceType: 'USER',
      resourceId: targetUserId,
      result: 'SUCCESS',
      metadata: { targetEmail: targetUser.email }
    });

    return {
      success: true,
      message: 'Authentification à deux facteurs désactivée avec succès pour ce collaborateur.',
    };
  }

  /**
   * Suppression d'un collaborateur système avec protection critique
   */
  async deleteCollaborator(targetUserId: string) {
    const store = TenantContextService.getStore();
    if (!store?.isSuperAdmin) throw new ForbiddenException('Accès réservé au Super Admin.');

    if (store.userId === targetUserId) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer votre propre compte d\'administration.');
    }

    const targetUser = await this.prisma.withoutTenantScope(async (c) =>
      c.user.findUnique({ where: { id: targetUserId }, include: { tenant: true, userRoles: { include: { role: true } } } })
    );

    if (!targetUser) throw new NotFoundException('Collaborateur introuvable.');

    if (targetUser.tenant.code !== 'SAAS-GLOBAL') {
      throw new ForbiddenException('Cette action est réservée aux membres de l\'équipe système.');
    }

    const isSuperAdmin = targetUser.userRoles.some((ur) => ur.role.name === 'SUPER_ADMIN');
    if (isSuperAdmin) {
      const activeSuperAdminCount = await this.prisma.withoutTenantScope(async (c) =>
        c.user.count({ where: { isActive: true, userRoles: { some: { role: { name: 'SUPER_ADMIN' } } } } }),
      );

      if (activeSuperAdminCount <= 1) {
        throw new ConflictException('Impossible de supprimer le dernier SUPER_ADMIN actif de la plateforme.');
      }
    }

    await this.prisma.withoutTenantScope(async (c) => {
      await c.userRole.deleteMany({ where: { userId: targetUserId } });
      await c.user.delete({ where: { id: targetUserId } });
    });

    await this.auditLogService.record({
      action: 'SUPER_ADMIN_COLLABORATOR_DELETED',
      resourceType: 'USER',
      resourceId: targetUserId,
      result: 'SUCCESS',
      metadata: { targetEmail: targetUser.email }
    });

    return { success: true, message: 'Collaborateur supprimé avec succès.' };
  }

  /**
   * Modification des données d'un collaborateur
   */
  async updateCollaborator(targetUserId: string, dto: { fullName?: string; email?: string; phone?: string }) {
    const store = TenantContextService.getStore();
    if (!store?.isSuperAdmin) throw new ForbiddenException('Accès réservé au Super Admin.');

    const targetUser = await this.prisma.withoutTenantScope(async (c) =>
      c.user.findUnique({ where: { id: targetUserId }, include: { tenant: true } })
    );

    if (!targetUser) throw new NotFoundException('Collaborateur introuvable.');

    if (targetUser.tenant.code !== 'SAAS-GLOBAL') {
      throw new ForbiddenException('Cette action est réservée aux membres de l\'équipe système.');
    }

    const data: any = {};
    if (dto.fullName) data.fullName = dto.fullName;
    if (dto.phone) data.phone = dto.phone;

    if (dto.email) {
      const normalizedEmail = dto.email.toLowerCase().trim();
      if (normalizedEmail !== targetUser.email) {
        const existing = await this.prisma.withoutTenantScope(async (c) =>
          c.user.findFirst({ where: { email: normalizedEmail } })
        );
        if (existing) throw new ConflictException('Cet email est déjà utilisé.');
        data.email = normalizedEmail;
      }
    }

    await this.prisma.withoutTenantScope(async (c) =>
      c.user.update({ where: { id: targetUserId }, data })
    );

    await this.auditLogService.record({
      action: 'SUPER_ADMIN_COLLABORATOR_UPDATED',
      resourceType: 'USER',
      resourceId: targetUserId,
      result: 'SUCCESS',
      metadata: { targetEmail: targetUser.email, updatedFields: Object.keys(data) }
    });

    return { success: true, message: 'Collaborateur mis à jour avec succès.' };
  }
}
