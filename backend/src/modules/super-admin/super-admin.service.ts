import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingCalculatorService } from '../billing/pricing-calculator.service';
import { AuditLogService } from './audit-log.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

@Injectable()
export class SuperAdminDashboardService {
  constructor(
    private prisma: PrismaService,
    private pricingCalculator: PricingCalculatorService,
    private auditLogService: AuditLogService,
    private notificationsService: NotificationsService,
  ) {}

  async updatePricingConfig(data: any) {
    return this.pricingCalculator.updatePricingConfig(data);
  }

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
    return this.prisma.withoutTenantScope(async (client) => {
      return client.tenant.findMany({
        include: {
          users: {
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
    });
  }

  async updateTenantBillingStatus(tenantId: string, status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED') {
    return this.prisma.withoutTenantScope(async (client) => {
      return client.tenant.update({
        where: { id: tenantId },
        data: { billingStatus: status },
      });
    });
  }

  async approvePayment(tenantId: string, durationMonths: number, proofId?: string) {
    const store = TenantContextService.getStore();
    if (!proofId && !store?.isSuperAdmin) {
      throw new ForbiddenException('Approbation sans preuve réservée au Super Admin. Un collaborateur doit fournir un proofId.');
    }

    const now = new Date();
    const subscriptionEndsAt = new Date(now);
    subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + durationMonths);

    const pricing = await this.pricingCalculator.calculatePrice(durationMonths);

    const result = await this.prisma.withoutTenantScope(async (client) => {
      if (proofId) {
        const proof = await client.paymentProof.findUnique({ where: { id: proofId } });
        if (proof && proof.amount < pricing.finalAmount * 0.99) {
          throw new BadRequestException(
            `Montant insuffisant. Attendu: ${pricing.finalAmount} XOF, Reçu: ${proof.amount} XOF.`
          );
        }

        await client.paymentProof.update({
          where: { id: proofId },
          data: {
            status: 'APPROVED',
            processedAt: now,
            expectedAmount: pricing.finalAmount,
            appliedMonthlyPrice: pricing.monthlyPrice,
          },
        });
      }

      return client.tenant.update({
        where: { id: tenantId },
        data: {
          billingStatus: 'ACTIVE',
          subscriptionEndsAt,
        },
      });
    });

    // 🔔 Notification tenant : paiement approuvé
    try {
      await this.notificationsService.create({
        tenantId,
        type: 'PAYMENT_APPROVED',
        title: '✅ Paiement validé',
        message: `Votre paiement a été validé. Abonnement actif jusqu'au ${subscriptionEndsAt.toLocaleDateString('fr-FR')}.`,
        link: '/billing',
      });
    } catch (e) {
      console.error('Erreur lors de la création de la notification (non-bloquant):', e);
    }

    if (!proofId) {
      await this.auditLogService.record({
        action: 'PAYMENT_APPROVED_WITHOUT_PROOF',
        resourceType: 'TENANT',
        resourceId: tenantId,
        result: 'SUCCESS',
        metadata: {
          durationMonths,
          expectedAmount: pricing.finalAmount,
        },
      });
    }

    return result;
  }


  async rejectPayment(proofId: string, tenantId?: string, reason?: string) {
    const result = await this.prisma.withoutTenantScope(async (client) => {
      return client.paymentProof.update({
        where: { id: proofId },
        data: {
          status: 'REJECTED',
          processedAt: new Date(),
        },
      });
    });

    // 🔔 Notification tenant : paiement rejeté
    if (tenantId) {
      try {
        await this.notificationsService.create({
          tenantId,
          type: 'PAYMENT_REJECTED',
          title: '❌ Paiement non validé',
          message: reason
            ? `Votre preuve de paiement a été rejetée : ${reason}`
            : 'Votre preuve de paiement a été rejetée. Veuillez soumettre une nouvelle preuve.',
          link: '/billing',
        });
      } catch (e) {
        console.error('Erreur lors de la création de la notification PaymentProof (non-bloquant):', e);
      }
    }

    return result;
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

  async hardDeleteTenant(tenantId: string, confirmationCode: string) {
    const tenant = await this.prisma.tenant.findUnique({ 
      where: { id: tenantId }, 
      select: { code: true, name: true, isPermanentDemo: true, isDemo: true, billingStatus: true } 
    });

    // 1. Tenant existe ?
    if (!tenant) throw new NotFoundException("Tenant introuvable.");

    // 2. Code de confirmation correspond ?
    if (confirmationCode !== tenant.code) {
      throw new BadRequestException("Le code de confirmation ne correspond pas au code du tenant.");
    }
    
    // 3. KPSY-ADMIN ?
    if (tenant.code === 'KPSY-ADMIN') {
      throw new ForbiddenException("Protection critique : Impossible de purger le compte Super Admin principal.");
    }
    
    // 4. isPermanentDemo ?
    if (tenant.isPermanentDemo) {
      throw new ForbiddenException("Protection : Ce tenant de démo est permanent et ne peut pas être purgé.");
    }

    // 5. isDemo + billingStatus (double critère)
    if (!tenant.isDemo || tenant.billingStatus === 'ACTIVE') {
      throw new ForbiddenException("Impossible de supprimer physiquement un tenant actif ou non-demo.");
    }

    // 6. Audit log
    await this.auditLogService.record({
      action: 'HARD_DELETE',
      resourceType: 'TENANT',
      resourceId: tenantId,
      result: 'SUCCESS',
      tenantId: tenantId,
      metadata: { code: tenant.code, name: tenant.name, isDemo: tenant.isDemo, billingStatus: tenant.billingStatus }
    });

    // 7. Suppression
    await this.prisma.tenant.delete({
      where: { id: tenantId }
    });

    return { message: "Tenant purgé définitivement avec succès." };
  }

  async getAllPaymentProofs() {
    return this.prisma.withoutTenantScope(async (client) => {
      return client.paymentProof.findMany({
        include: { tenant: true },
        orderBy: { submittedAt: 'desc' },
      });
    });
  }
}




