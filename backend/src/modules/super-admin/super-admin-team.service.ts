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
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { InviteCollaboratorDto, AcceptInvitationDto, UpdateCollaboratorRoleDto } from './dto/super-admin-team.dto';

@Injectable()
export class SuperAdminTeamService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Calcul cryptographique du Hash SHA-256 (Pas de stockage de token brut en BDD)
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Création d'une invitation sécurisée à usage unique
   */
  async inviteCollaborator(dto: InviteCollaboratorDto) {
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

    // 🔒 SÉCURITÉ 1 : Génération cryptographique d'un token aléatoire de 32 octets
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expiration stricte 24H

    const invitation = await this.prisma.withoutTenantScope(async (c) =>
      c.superAdminInvitation.create({
        data: {
          email: normalizedEmail,
          roleName: dto.roleName,
          tokenHash,
          invitedById: store.userId || 'SUPER_ADMIN',
          status: 'INVITED',
          expiresAt,
        },
      }),
    );

    await this.auditLogService.record({
      action: 'SUPER_ADMIN_INVITATION_CREATED',
      resourceType: 'SUPER_ADMIN_INVITATION',
      resourceId: invitation.id,
      result: 'SUCCESS',
      metadata: { email: normalizedEmail, roleName: dto.roleName },
    });

    return {
      success: true,
      message: 'Invitation créée avec succès !',
      invitationId: invitation.id,
      email: invitation.email,
      roleName: invitation.roleName,
      expiresAt: invitation.expiresAt,
      // Le token brut est transmis uniquement à la réponse de création (jamais stocké en BDD)
      invitationLink: `https://doorwaar.kpsyinformatique.com/accept-invitation?token=${rawToken}`,
    };
  }

  /**
   * Renvoi d'invitation avec invalidation de l'ancienne
   */
  async resendInvitation(invitationId: string) {
    const existing = await this.prisma.withoutTenantScope(async (c) =>
      c.superAdminInvitation.findUnique({ where: { id: invitationId } }),
    );

    if (!existing || existing.status !== 'INVITED') {
      throw new NotFoundException('Invitation active introuvable.');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const updated = await this.prisma.withoutTenantScope(async (c) =>
      c.superAdminInvitation.update({
        where: { id: invitationId },
        data: { tokenHash, expiresAt },
      }),
    );

    await this.auditLogService.record({
      action: 'SUPER_ADMIN_INVITATION_RESENT',
      resourceType: 'SUPER_ADMIN_INVITATION',
      resourceId: updated.id,
      result: 'SUCCESS',
      metadata: { email: updated.email },
    });

    return {
      success: true,
      invitationLink: `https://doorwaar.kpsyinformatique.com/accept-invitation?token=${rawToken}`,
    };
  }

  /**
   * Annulation d'une invitation
   */
  async cancelInvitation(invitationId: string) {
    const updated = await this.prisma.withoutTenantScope(async (c) =>
      c.superAdminInvitation.update({
        where: { id: invitationId },
        data: { status: 'CANCELLED' },
      }),
    );

    await this.auditLogService.record({
      action: 'SUPER_ADMIN_INVITATION_CANCELLED',
      resourceType: 'SUPER_ADMIN_INVITATION',
      resourceId: updated.id,
      result: 'SUCCESS',
    });

    return { success: true, message: 'Invitation annulée.' };
  }

  /**
   * Acceptation transactionnelle et sécurisée d'une invitation
   */
  async acceptInvitation(dto: AcceptInvitationDto) {
    const inputHash = this.hashToken(dto.token);

    const invitation = await this.prisma.withoutTenantScope(async (c) =>
      c.superAdminInvitation.findUnique({ where: { tokenHash: inputHash } }),
    );

    if (!invitation || invitation.status !== 'INVITED') {
      throw new BadRequestException('Invitation invalide, annulée ou déjà utilisée.');
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      await this.prisma.withoutTenantScope(async (c) =>
        c.superAdminInvitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } }),
      );
      throw new BadRequestException('L\'invitation a expiré.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      // Résolution du rôle système correspondant dans la BDD
      let role = await tx.role.findFirst({ where: { name: invitation.roleName, tenantId: null } });
      if (!role) {
        role = await tx.role.create({
          data: { name: invitation.roleName, description: `Rôle système Super Admin ${invitation.roleName}` },
        });
      }

      // Résolution du Tenant système Global "SYSTEM_TENANT"
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
          email: invitation.email,
          phone: dto.phone,
          passwordHash,
          isActive: true,
          userRoles: {
            create: { roleId: role.id },
          },
        },
      });

      // Invalidation immédiate de l'invitation à ACCEPTED
      await tx.superAdminInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      await this.auditLogService.record({
        action: 'SUPER_ADMIN_INVITATION_ACCEPTED',
        resourceType: 'USER',
        resourceId: newUser.id,
        result: 'SUCCESS',
        metadata: { email: newUser.email, roleName: invitation.roleName },
      });

      return {
        success: true,
        message: 'Compte collaborateur activé avec succès !',
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
}
