import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, ChangePasswordDto } from './dto/auth.dto';
import { SectorType, RoleType, BillingStatus, JwtPayload } from '../types/tenant.types';
import * as bcrypt from 'bcryptjs';
import { EmailOtpService } from '../../modules/notifications/email-otp.service';

@Injectable()
export class AuthService {
  private registrationCache = new Map<string, { dto: RegisterDto; expiresAt: number }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailOtpService: EmailOtpService,
  ) {}

  async registerInit(dto: RegisterDto) {
    const existingUser = await this.prisma.withoutTenantScope(async (client) => {
      return client.user.findFirst({
        where: { email: dto.email },
      });
    });
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà.');
    }

    const existingPhone = await this.prisma.withoutTenantScope(async (client) => {
      return client.user.findFirst({
        where: { phone: dto.phone },
      });
    });
    if (existingPhone) {
      throw new ConflictException('Un utilisateur avec ce numéro de téléphone existe déjà.');
    }

    const ttlMs = 5 * 60 * 1000;
    this.registrationCache.set(dto.email, {
      dto,
      expiresAt: Date.now() + ttlMs,
    });

    await this.emailOtpService.sendOtp(dto.email);

    return {
      message: 'Un code de vérification a été envoyé à votre adresse email.',
    };
  }

  async registerConfirm(email: string, otp: string) {
    await this.emailOtpService.verifyOtp(email, otp);

    const cachedData = this.registrationCache.get(email);
    if (!cachedData || Date.now() > cachedData.expiresAt) {
      this.registrationCache.delete(email);
      throw new BadRequestException('Session d\'inscription expirée ou introuvable. Veuillez recommencer.');
    }

    const dto = cachedData.dto;
    this.registrationCache.delete(email);


    const prefixMap: Record<SectorType, string> = {
      [SectorType.QUINCAILLERIE]: 'QNC',
      [SectorType.MULTISERVICES_IT]: 'ITS',
      [SectorType.TAILLEUR]: 'TLR',
    };

    const prefix = prefixMap[dto.sectorType] || 'TNT';
    const tenantCount = await this.prisma.withoutTenantScope(async (client) => {
      return client.tenant.count({
        where: { sectorType: dto.sectorType },
      });
    });
    const tenantCode = `${prefix}-${(tenantCount + 1).toString().padStart(4, '0')}`;

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    return this.prisma.withoutTenantScope(async (tx) => {
      const tenant = await tx.tenant.create({


        data: {
          code: tenantCode,
          name: dto.companyName,
          sectorType: dto.sectorType,
          country: dto.country || 'SN',
          phone: dto.phone,
          email: dto.email,
          billingStatus: BillingStatus.TRIAL_7D,
          trialEndsAt,
        },
      });

      const userCount = await tx.user.count({ where: { tenantId: tenant.id } });
      const username = `${tenantCode}-${(userCount + 1).toString().padStart(2, '0')}`;
      const passwordHash = await bcrypt.hash(dto.password, 10);

      let adminRole = await tx.role.findFirst({
        where: { name: RoleType.ADMIN_TENANT, tenantId: tenant.id },
      });
      if (!adminRole) {
        adminRole = await tx.role.create({
          data: {
            tenantId: tenant.id,
            name: RoleType.ADMIN_TENANT,
            description: 'Propriétaire / Administrateur du compte tenant',
          },
        });
      }

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          username,
          fullName: dto.managerName,
          email: dto.email,
          emailVerified: true,
          phone: dto.phone,
          passwordHash,
          userRoles: {
            create: { roleId: adminRole.id },
          },
        },
      });

      const payload: JwtPayload = {
        sub: user.id,
        tenantId: tenant.id,
        sectorType: tenant.sectorType as SectorType,
        roles: [RoleType.ADMIN_TENANT],
        tenantCode: tenant.code,
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        message: 'Inscription réussie (Trial 7 jours actif).',
        accessToken,
        tenant: {
          id: tenant.id,
          code: tenant.code,
          name: tenant.name,
          sectorType: tenant.sectorType,
        },
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          emailVerified: user.emailVerified,
        },
      };
    });
  }



  async login(dto: LoginDto) {
    const identifier = dto.identifier ? dto.identifier.trim() : '';

    const user = await this.prisma.withoutTenantScope(async (c) =>
      c.user.findFirst({
        where: {
          OR: [
            { email: { equals: identifier, mode: 'insensitive' } },
            { username: { equals: identifier, mode: 'insensitive' } },
          ],
        },
        include: {
          tenant: true,
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          },
        },
      }),
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    if (!user.tenant || (user.tenant.deletedAt && !user.tenant.isPermanentDemo)) {
      throw new UnauthorizedException('Votre espace est suspendu ou supprimé.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Récupérer le tableau plat de codes de permission (sans doublon)
    const permissionsSet = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        if (rp.permission?.code) {
          permissionsSet.add(rp.permission.code);
        }
      });
    });
    const permissions = Array.from(permissionsSet);

    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenant.id,
      tenantCode: user.tenant.code,
      sectorType: user.tenant.sectorType as SectorType,
      roles: user.userRoles.map((ur) => ur.role.name as RoleType),
      permissions: permissions, // Permissions dynamiques injectées !
      billingStatus: user.tenant.billingStatus as BillingStatus,
      mustChangePassword: user.mustChangePassword,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      tenant: {
        id: user.tenant.id,
        code: user.tenant.code,
        name: user.tenant.name,
        sectorType: user.tenant.sectorType,
      },
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.userRoles.map((ur) => ur.role.name),
      },
    };
  }

  async changePassword(userId: string | undefined, dto: any) {
    if (!userId) throw new UnauthorizedException('Utilisateur non connecté.');
    
    const user = await this.prisma.withoutTenantScope(async (client) => {
      return client.user.findUnique({ where: { id: userId } });
    });

    if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Identifiants incorrects.');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.withoutTenantScope(async (client) => {
      return client.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          mustChangePassword: false,
        },
      });
    });

    // TODO: log password change?
    return { message: 'Mot de passe modifié avec succès.' };
  }
}
