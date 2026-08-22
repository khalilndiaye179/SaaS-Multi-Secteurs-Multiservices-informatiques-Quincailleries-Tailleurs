import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
import { SectorType, RoleType, BillingStatus } from './types/tenant.types';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.prisma.withoutTenantScope(async (tx) => {
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Garde-fou de production
      const existingSuperAdmin = await tx.user.findFirst({
        where: { username: 'SUPER-ADMIN-01' },
      });
      if (isProduction && existingSuperAdmin) {
        console.log('⚠️ Production : Base déjà initialisée. Seeding automatique ignoré.');
        return;
      }

      await this.seedPermissions(tx);
      await this.seedSuperAdmin(tx);
      await this.seedPricingConfig(tx);
      
      if (!isProduction) {
        await this.seedDemoTenants(tx);
      }
    });
  }

  private async seedPermissions(tx: PrismaClient) {
    const permissions = [
      // Permissions Globales (Transverses)
      { code: 'settings:read', description: 'Voir les paramètres', sectorType: null },
      { code: 'settings:write', description: 'Modifier les paramètres et rôles', sectorType: null },
      { code: 'billing:read', description: 'Voir la facturation', sectorType: null },
      { code: 'billing:write', description: 'Gérer la facturation', sectorType: null },
      { code: 'employees:read', description: 'Voir les employés', sectorType: null },
      { code: 'employees:write', description: 'Gérer les employés', sectorType: null },
      
      // Quincaillerie
      { code: 'stock:read', description: 'Voir le stock', sectorType: SectorType.QUINCAILLERIE },
      { code: 'stock:write', description: 'Gérer le stock', sectorType: SectorType.QUINCAILLERIE },
      { code: 'sales:read', description: 'Voir les ventes', sectorType: SectorType.QUINCAILLERIE },
      { code: 'sales:write', description: 'Enregistrer des ventes', sectorType: SectorType.QUINCAILLERIE },
      
      // Multiservices IT
      { code: 'tickets:read', description: 'Voir les tickets', sectorType: SectorType.MULTISERVICES_IT },
      { code: 'tickets:write', description: 'Gérer les tickets', sectorType: SectorType.MULTISERVICES_IT },
      
      // Tailleur
      { code: 'measurements:read', description: 'Voir les mensurations', sectorType: SectorType.TAILLEUR },
      { code: 'measurements:write', description: 'Gérer les mensurations', sectorType: SectorType.TAILLEUR },
      { code: 'orders:read', description: 'Voir les commandes', sectorType: SectorType.TAILLEUR },
      { code: 'orders:write', description: 'Gérer les commandes', sectorType: SectorType.TAILLEUR },
    ];

    for (const p of permissions) {
      await tx.permission.upsert({
        where: { code: p.code },
        update: { description: p.description, sectorType: p.sectorType as any },
        create: { code: p.code, description: p.description, sectorType: p.sectorType as any },
      });
    }
  }

  private async seedPricingConfig(tx: PrismaClient) {
    const existingConfig = await (tx as any).pricingConfig.findFirst({
      where: { isDefault: true },
    });

    if (!existingConfig) {
      await (tx as any).pricingConfig.create({
        data: {
          baseMonthlyPrice: 6500,
          discount6Months: 0.10,
          discount12Months: 0.20,
          currency: 'XOF',
          isDefault: true,
        },
      });
    }
  }

  private async seedSuperAdmin(tx: PrismaClient) {
    const superTenant = await tx.tenant.upsert({
      where: { code: 'KPSY-ADMIN' },
      update: {
        billingStatus: BillingStatus.ACTIVE,
        deletedAt: null,
        isDemo: false,
        isPermanentDemo: true,
      },
      create: {
        code: 'KPSY-ADMIN',
        name: 'KPSyDesk Super Admin Global',
        sectorType: SectorType.QUINCAILLERIE,
        country: 'SN',
        billingStatus: BillingStatus.ACTIVE,
        isDemo: false,
        isPermanentDemo: true,
      },
    });

    let superRole = await tx.role.findFirst({
      where: { name: RoleType.SUPER_ADMIN },
    });

    if (!superRole) {
      superRole = await tx.role.create({
        data: {
          name: RoleType.SUPER_ADMIN,
          description: 'Rôle de supervision globale KPSyDesk',
        },
      });
    }

    const existingSuperAdmin = await tx.user.findFirst({
      where: { username: 'SUPER-ADMIN-01' },
    });

    if (!existingSuperAdmin) {
      const initialPassword = process.env.INITIAL_SUPERADMIN_PASSWORD;
      if (!initialPassword) {
        console.warn('⚠️ INITIAL_SUPERADMIN_PASSWORD non défini. Utilisation du mot de passe de secours temporaire.');
      }
      const passwordHash = await bcrypt.hash(initialPassword || 'ChangeMeNow2026!', 10);

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
    } else {
      await tx.user.update({
        where: { id: existingSuperAdmin.id },
        data: {
          tenantId: superTenant.id,
        },
      });
    }
  }

  private async seedDemoTenants(tx: PrismaClient) {
    const demos = [
      { code: 'QNC-0001', name: 'Quincaillerie Al-Baraka', sector: SectorType.QUINCAILLERIE, email: 'gerant@quincaillerie.sn', username: 'QNC-0001-01' },
      { code: 'ITS-0001', name: 'Multiservices IT Dakar', sector: SectorType.MULTISERVICES_IT, email: 'gerant@multiservices-it.sn', username: 'ITS-0001-01' },
      { code: 'TLR-0001', name: 'Atelier Couture Elegance', sector: SectorType.TAILLEUR, email: 'gerant@couture.sn', username: 'TLR-0001-01' },
    ];

    for (const d of demos) {
      const tenant = await tx.tenant.upsert({
        where: { code: d.code },
        update: {
          name: d.name,
          sectorType: d.sector,
          billingStatus: BillingStatus.ACTIVE,
          deletedAt: null,
          isDemo: true,
          isPermanentDemo: true,
        },
        create: {
          code: d.code,
          name: d.name,
          sectorType: d.sector,
          country: 'SN',
          billingStatus: BillingStatus.ACTIVE,
          isDemo: true,
          isPermanentDemo: true,
        },
      });

      let adminRole = await tx.role.findFirst({
        where: { tenantId: tenant.id, name: RoleType.ADMIN_TENANT },
      });

      if (!adminRole) {
        adminRole = await tx.role.create({
          data: {
            tenantId: tenant.id,
            name: RoleType.ADMIN_TENANT,
            description: `Administrateur ${d.name}`,
          },
        });
      }

      const existingUser = await tx.user.findFirst({
        where: {
          OR: [{ username: d.username }, { email: d.email }],
        },
      });

      if (!existingUser) {
        const initialDemoPassword = process.env.INITIAL_DEMO_PASSWORD;
        if (!initialDemoPassword) {
          console.warn('⚠️ INITIAL_DEMO_PASSWORD non défini.');
        }
        const passwordHash = await bcrypt.hash(initialDemoPassword || 'DemoPass123!', 10);

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
      } else {
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            tenantId: tenant.id,
            username: d.username,
            email: d.email,
          },
        });
      }
    }
  }
}

