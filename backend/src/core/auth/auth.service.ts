import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { SectorType, RoleType, BillingStatus, JwtPayload } from '../types/tenant.types';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.withoutTenantScope(async (client) => {
      return client.user.findFirst({
        where: { email: dto.email },
      });
    });
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà.');
    }


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
        },
      };
    });
  }



  async login(dto: LoginDto) {
    const identifier = dto.identifier ? dto.identifier.trim() : '';

    const user = await this.prisma.withoutTenantScope(async (client) => {
      return client.user.findFirst({
        where: {
          OR: [
            { email: { equals: identifier, mode: 'insensitive' } },
            { username: { equals: identifier, mode: 'insensitive' } },
          ],
        },
        include: {
          tenant: true,
          userRoles: { include: { role: true } },
        },
      });
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Identifiants incorrects.');
    }

    if (user.tenant.billingStatus === ('ARCHIVED' as any)) {
      throw new UnauthorizedException('Ce compte d\'entreprise a été archivé. Veuillez contacter l\'administration.');
    }

    const roles = user.userRoles.map((ur) => ur.role.name as RoleType);

    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      sectorType: user.tenant.sectorType as SectorType,
      roles,
      tenantCode: user.tenant.code,
      billingStatus: user.tenant.billingStatus as BillingStatus,
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
        roles,
      },
    };
  }
}
