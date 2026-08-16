import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingCalculatorService } from '../billing/pricing-calculator.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class SuperAdminDashboardService {
  constructor(
    private prisma: PrismaService,
    private pricingCalculator: PricingCalculatorService,
  ) {}



  async getGlobalStats() {
    const totalTenants = await this.prisma.tenant.count();
    const trialTenants = await this.prisma.tenant.count({ where: { billingStatus: 'TRIAL_7D' } });
    const activeTenants = await this.prisma.tenant.count({ where: { billingStatus: 'ACTIVE' } });
    const suspendedTenants = await this.prisma.tenant.count({ where: { billingStatus: 'SUSPENDED' } });

    const sectorBreakdown = {
      QUINCAILLERIE: await this.prisma.tenant.count({ where: { sectorType: 'QUINCAILLERIE' } }),
      MULTISERVICES_IT: await this.prisma.tenant.count({ where: { sectorType: 'MULTISERVICES_IT' } }),
      TAILLEUR: await this.prisma.tenant.count({ where: { sectorType: 'TAILLEUR' } }),
    };

    const countryBreakdown = {
      SN: await this.prisma.tenant.count({ where: { country: 'SN' } }),
      CI: await this.prisma.tenant.count({ where: { country: 'CI' } }),
      ML: await this.prisma.tenant.count({ where: { country: 'ML' } }),
    };

    const pendingProofsCount = await this.prisma.paymentProof.count({ where: { status: 'PENDING' } });
    const expiredTenants = await this.prisma.tenant.count({ where: { billingStatus: 'EXPIRED' } });

    // Calcul du volume d'affaires consolidé estimé en XOF
    const allInvoices = await this.prisma.withoutTenantScope(async (c) => c.invoice.findMany({ select: { totalAmount: true } }));
    const totalInvoicesVolumeXOF = allInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    const allMovementsOut = await this.prisma.withoutTenantScope(async (c) => c.stockMovement.findMany({ where: { type: 'OUT' }, select: { quantity: true, unitPrice: true } }));
    const totalQuincaillerieSalesXOF = allMovementsOut.reduce((sum, m) => sum + (m.quantity * (m.unitPrice || 0)), 0);

    return {
      totalTenants,
      trialTenants,
      activeTenants,
      expiredTenants,
      suspendedTenants,
      pendingProofsCount,
      totalInvoicesVolumeXOF,
      totalQuincaillerieSalesXOF,
      sectorBreakdown,
      countryBreakdown,
    };
  }

  async getAllTenants() {
    return this.prisma.tenant.findMany({
      include: {
        users: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            username: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTenantBillingStatus(tenantId: string, status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED') {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { billingStatus: status },
    });
  }

  async approvePayment(tenantId: string, durationMonths: number, proofId?: string) {
    const now = new Date();
    const subscriptionEndsAt = new Date(now);
    subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + durationMonths);

    const pricing = await this.pricingCalculator.calculatePrice(durationMonths);

    return this.prisma.$transaction(async (tx) => {
      if (proofId) {
        await tx.paymentProof.update({
          where: { id: proofId },
          data: {
            status: 'APPROVED',
            processedAt: now,
            expectedAmount: pricing.finalAmount,
            appliedMonthlyPrice: pricing.monthlyPrice,
          },
        });
      }

      return tx.tenant.update({
        where: { id: tenantId },
        data: {
          billingStatus: 'ACTIVE',
          subscriptionEndsAt,
        },
      });
    });
  }


  async rejectPayment(proofId: string, reason?: string) {
    return this.prisma.paymentProof.update({
      where: { id: proofId },
      data: {
        status: 'REJECTED',
        processedAt: new Date(),
      },
    });
  }

  async getDemoTenantsToPurge() {
    return this.prisma.tenant.findMany({
      where: {
        isDemo: true,
        isPermanentDemo: false,
        billingStatus: { not: 'ARCHIVED' },
      },
      select: { id: true, code: true, name: true, sectorType: true, createdAt: true },
    });
  }

  async purgeDemoTenants() {
    // 🔒 SÉCURITÉ 1 : Interdiction stricte en environnement de PRODUCTION
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (nodeEnv.toLowerCase() === 'production') {
      throw new ForbiddenException(
        'SECURITY ERROR: La purge des tenants de démonstration est strictement interdite en environnement de PRODUCTION.',
      );
    }

    // 🔒 SÉCURITÉ 2 : Filtre strict basé EXCLUSIVEMENT sur isDemo: true AND isPermanentDemo: false
    const demoTenantsToPurge = await this.prisma.tenant.findMany({
      where: {
        isDemo: true,
        isPermanentDemo: false,
        billingStatus: { not: 'ARCHIVED' },
      },
      select: { id: true, code: true, name: true },
    });

    const demoIds = demoTenantsToPurge.map((t) => t.id);

    if (demoIds.length === 0) {
      return { message: 'Aucun tenant de démonstration actif à purger.', count: 0, purgedTenants: [] };
    }

    // 🔒 SÉCURITÉ 3 : SOFT DELETE UNISYSTEME (Archivage logique, aucun DELETE physique)
    await this.prisma.tenant.updateMany({
      where: {
        id: { in: demoIds },
      },
      data: {
        billingStatus: 'ARCHIVED',
        deletedAt: new Date(),
      },
    });

    return {
      message: `Purger effectuée avec succès : ${demoIds.length} tenants de démonstration archivés (Soft Delete).`,
      count: demoIds.length,
      purgedTenants: demoTenantsToPurge,
    };
  }



  async updateTenant(tenantId: string, data: UpdateTenantDto) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email && { email: data.email }),
        ...(data.country && { country: data.country }),
      },
    });
  }

  async softDeleteTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { code: true } });
    if (tenant?.code === 'KPSY-ADMIN') {
      throw new ForbiddenException("Protection critique : Impossible d'archiver le compte Super Admin principal.");
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        billingStatus: 'ARCHIVED',
        deletedAt: new Date(),
      },
    });
  }

  async getAllPaymentProofs() {
    return this.prisma.paymentProof.findMany({
      include: { tenant: true },
      orderBy: { submittedAt: 'desc' },
    });
  }
}




