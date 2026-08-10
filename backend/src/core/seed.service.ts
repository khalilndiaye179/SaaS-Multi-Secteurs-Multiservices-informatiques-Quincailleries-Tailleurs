import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
import { SectorType, RoleType, BillingStatus } from './types/tenant.types';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.prisma.withoutTenantScope(async (tx) => {
      await this.seedSuperAdmin(tx);
      await this.seedDemoTenants(tx);
    });
  }

  private async seedSuperAdmin(tx: PrismaClient) {
    const existingSuperAdmin = await tx.user.findFirst({
      where: { username: 'SUPER-ADMIN-01' },
    });

    if (!existingSuperAdmin) {
      const superTenant = await tx.tenant.upsert({
        where: { code: 'KPSY-ADMIN' },
        update: {},
        create: {
          code: 'KPSY-ADMIN',
          name: 'KPSyDesk Super Admin Global',
          sectorType: SectorType.QUINCAILLERIE,
          country: 'SN',
          billingStatus: BillingStatus.ACTIVE,
          isDemo: true,
        },
      });

      const superRole = await tx.role.create({
        data: {
          name: RoleType.SUPER_ADMIN,
          description: 'Rôle de supervision globale KPSyDesk',
        },
      });

      const passwordHash = await bcrypt.hash('AdminPass2026!', 10);
      await tx.user.create({
        data: {
          tenantId: superTenant.id,
          username: 'SUPER-ADMIN-01',
          fullName: 'Khalil NDIAYE (Super Admin)',
          email: 'admin@kpsydesk.sn',
          phone: '+221 77 000 00 00',
          passwordHash,
          userRoles: {
            create: { roleId: superRole.id },
          },
        },
      });
    }
  }

  private async seedDemoTenants(tx: PrismaClient) {
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const demos = [
      { code: 'QNC-0001', name: 'Quincaillerie Al-Baraka', sector: SectorType.QUINCAILLERIE, email: 'gerant@quincaillerie.sn', username: 'QNC-0001-01' },
      { code: 'ITS-0001', name: 'Multiservices IT Dakar', sector: SectorType.MULTISERVICES_IT, email: 'gerant@multiservices-it.sn', username: 'ITS-0001-01' },
      { code: 'TLR-0001', name: 'Atelier Couture Elegance', sector: SectorType.TAILLEUR, email: 'gerant@couture.sn', username: 'TLR-0001-01' },
    ];

    for (const d of demos) {
      const existing = await tx.tenant.findUnique({ where: { code: d.code } });
      if (!existing) {
        const tenant = await tx.tenant.create({
          data: {
            code: d.code,
            name: d.name,
            sectorType: d.sector,
            country: 'SN',
            billingStatus: BillingStatus.ACTIVE,
            isDemo: true,
          },
        });

        const adminRole = await tx.role.create({
          data: {
            tenantId: tenant.id,
            name: RoleType.ADMIN_TENANT,
            description: `Administrateur ${d.name}`,
          },
        });

        await tx.user.create({
          data: {
            tenantId: tenant.id,
            username: d.username,
            fullName: `Gérant ${d.name}`,
            email: d.email,
            phone: '+221 77 111 22 33',
            passwordHash,
            userRoles: {
              create: { roleId: adminRole.id },
            },
          },
        });
      }
    }
  }
}
