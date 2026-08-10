import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SuperAdminDashboardService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.$transaction(async (tx) => {
      if (proofId) {
        await tx.paymentProof.update({
          where: { id: proofId },
          data: { status: 'APPROVED', processedAt: now },
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

  async purgeDemoTenants() {
    // Liste blanche des codes tenants officiels à préserver
    const preservedCodes = ['QNC-0001', 'ITS-0001', 'TLR-0001'];

    // Récupérer les IDs des tenants non préservés
    const tenantsToPurge = await this.prisma.tenant.findMany({
      where: {
        code: { notIn: preservedCodes },
      },
      select: { id: true, code: true, name: true },
    });

    const purgedIds = tenantsToPurge.map((t) => t.id);

    if (purgedIds.length === 0) {
      return { message: 'Aucun tenant test à purger.', count: 0 };
    }

    // Purge en cascade des tenants non autorisés
    await this.prisma.tenant.deleteMany({
      where: {
        id: { in: purgedIds },
      },
    });

    return {
      message: `Purger effectuée avec succès : ${purgedIds.length} tenants tests supprimés définitivement.`,
      count: purgedIds.length,
      purgedTenants: tenantsToPurge,
    };
  }

  async getAllPaymentProofs() {
    return this.prisma.paymentProof.findMany({
      include: { tenant: true },
      orderBy: { submittedAt: 'desc' },
    });
  }
}



