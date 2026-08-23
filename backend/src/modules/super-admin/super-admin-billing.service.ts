import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingCalculatorService } from '../billing/pricing-calculator.service';
import { AuditLogService } from './audit-log.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { SuperAdminBillingFilterDto } from './dto/super-admin-billing.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SuperAdminBillingService {
  constructor(
    private prisma: PrismaService,
    private pricingCalculator: PricingCalculatorService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Normalisation et validation sÃ©curisÃ©e des bornes temporelles (Timezone UTC ISO)
   */
  private parseDateBounds(dateFrom?: string, dateTo?: string) {
    let from: Date | undefined;
    let to: Date | undefined;

    if (dateFrom) {
      from = new Date(dateFrom);
      if (isNaN(from.getTime())) throw new BadRequestException('Format de date de dÃ©but invalide (dateFrom).');
    }

    if (dateTo) {
      to = new Date(dateTo);
      if (isNaN(to.getTime())) throw new BadRequestException('Format de date de fin invalide (dateTo).');
    }

    return { from, to };
  }

  /**
   * Vue consolidÃ©e et mÃ©triques financiÃ¨res globales de la plateforme SaaS
   */
  async getFinancialOverview(query: SuperAdminBillingFilterDto) {
    const store = TenantContextService.getStore();

    const { from, to } = this.parseDateBounds(query.dateFrom, query.dateTo);

    const invoiceWhere: any = { tenant: { isDemo: false } };
    const proofWhere: any = { tenant: { isDemo: false } };
    const tenantWhere: any = { isDemo: false };

    if (from || to) {
      invoiceWhere.createdAt = {};
      proofWhere.createdAt = {};
      if (from) {
        invoiceWhere.createdAt.gte = from;
        proofWhere.createdAt.gte = from;
      }
      if (to) {
        invoiceWhere.createdAt.lte = to;
        proofWhere.createdAt.lte = to;
      }
    }

    if (query.tenantId) {
      invoiceWhere.tenantId = query.tenantId;
      proofWhere.tenantId = query.tenantId;
      tenantWhere.id = query.tenantId;
    }

    // ExÃ©cution parallÃ¨le des agrÃ©gations financiÃ¨res haute performance SQL/Prisma
    const [invoices, proofs, activeTenants, allTenants] = await this.prisma.withoutTenantScope(async (c) =>
      Promise.all([
        c.invoice.findMany({ where: invoiceWhere }),
        c.paymentProof.findMany({ where: proofWhere }),
        c.tenant.findMany({ where: { ...tenantWhere, billingStatus: 'ACTIVE' } }),
        c.tenant.findMany({ where: tenantWhere }),
      ]),
    );

    // 1. CA FacturÃ© (Somme des factures Ã©mises)
    let billedTotal = new Prisma.Decimal(0);
    let receivablesTotal = new Prisma.Decimal(0);

    invoices.forEach((inv: any) => {
      const amt = new Prisma.Decimal(inv.totalAmount || 0);
      billedTotal = billedTotal.add(amt);
      if (inv.status === 'UNPAID' || inv.status === 'OVERDUE') {
        receivablesTotal = receivablesTotal.add(amt);
      }
    });

    // 2. CA EncaissÃ© (Somme des preuves de paiement validÃ©es APPROVED)
    let collectedTotal = new Prisma.Decimal(0);
    let pendingCollectedTotal = new Prisma.Decimal(0);

    proofs.forEach((prf: any) => {
      const amt = new Prisma.Decimal(prf.amount || 0);
      if (prf.status === 'APPROVED') {
        collectedTotal = collectedTotal.add(amt);
      } else if (prf.status === 'PENDING') {
        pendingCollectedTotal = pendingCollectedTotal.add(amt);
      }
    });

    // 3. Calcul strict du MRR (Monthly Recurring Revenue) & ARR Ã  partir des abonnements actifs
    const pricingConfig = await this.pricingCalculator.getPricingConfig();
    const baseMonthlyPrice = new Prisma.Decimal(pricingConfig.baseMonthlyPrice || 6500);

    // MRR = Somme des abonnements actifs * Tarif mensuel de base
    const mrr = baseMonthlyPrice.mul(activeTenants.length);
    const arr = mrr.mul(12);

    await this.auditLogService.record({
      action: 'SUPER_ADMIN_BILLING_VIEW',
      resourceType: 'FINANCIAL_OVERVIEW',
      resourceId: 'PLATFORM_METRICS',
      result: 'SUCCESS',
      metadata: { billedTotal: billedTotal.toNumber(), collectedTotal: collectedTotal.toNumber(), mrr: mrr.toNumber() },
    });

    return {
      currency: pricingConfig.currency || 'XOF',
      metrics: {
        billedTotal: billedTotal.toNumber(), // CA FacturÃ©
        collectedTotal: collectedTotal.toNumber(), // CA EncaissÃ©
        receivablesTotal: receivablesTotal.toNumber(), // CrÃ©ances / ImpayÃ©s
        pendingCollectedTotal: pendingCollectedTotal.toNumber(), // Paiements en attente de validation
        mrr: mrr.toNumber(), // Monthly Recurring Revenue
        arr: arr.toNumber(), // Annual Recurring Revenue
        activeSubscriptionsCount: activeTenants.length,
        totalTenantsCount: allTenants.length,
      },
    };
  }

  /**
   * Vue financiÃ¨re dÃ©taillÃ©e par Tenant
   */
  async getTenantFinancials(query: SuperAdminBillingFilterDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [tenants, total] = await this.prisma.withoutTenantScope(async (c) =>
      Promise.all([
        c.tenant.findMany({
          where: { isDemo: false },
          include: {
            invoices: true,
            paymentProofs: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        c.tenant.count({ where: { isDemo: false } }),
      ]),
    );

    const data = tenants.map((t: any) => {
      let billed = new Prisma.Decimal(0);
      let paid = new Prisma.Decimal(0);

      t.invoices.forEach((inv: any) => {
        billed = billed.add(new Prisma.Decimal(inv.totalAmount || 0));
      });

      t.paymentProofs.forEach((prf: any) => {
        if (prf.status === 'APPROVED') {
          paid = paid.add(new Prisma.Decimal(prf.amount || 0));
        }
      });

      const outstanding = billed.sub(paid);

      return {
        tenantId: t.id,
        code: t.code,
        name: t.name,
        sectorType: t.sectorType,
        billingStatus: t.billingStatus,
        subscriptionEndsAt: t.subscriptionEndsAt,
        totalBilled: billed.toNumber(),
        totalPaid: paid.toNumber(),
        totalOutstanding: Math.max(0, outstanding.toNumber()),
      };
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Service de Rapprochement Comptable et DÃ©tection d'Anomalies
   */
  async getReconciliationAnomalies() {
    const [invoices, proofs] = await this.prisma.withoutTenantScope(async (c) =>
      Promise.all([
        c.invoice.findMany({ where: { tenant: { isDemo: false } }, include: { tenant: { select: { id: true, name: true, code: true } } } }),
        c.paymentProof.findMany({ where: { tenant: { isDemo: false } }, include: { tenant: { select: { id: true, name: true, code: true } } } }),
      ]),
    );

    const anomalies: any[] = [];

    // DÃ©tection 1 : Preuves de paiement en attente sans facture correspondante
    proofs.forEach((prf: any) => {
      if (prf.status === 'PENDING') {
        anomalies.push({
          type: 'PAYMENT_PENDING_APPROVAL',
          severity: 'MEDIUM',
          tenant: prf.tenant,
          description: `Preuve de paiement de ${prf.amount} XOF en attente de validation manuelle pour le tenant ${prf.tenant.name}.`,
          referenceId: prf.id,
        });
      }
    });

    // DÃ©tection 2 : Factures impayÃ©es dont la date d'Ã©chÃ©ance est dÃ©passÃ©e
    invoices.forEach((inv: any) => {
      if (inv.status === 'UNPAID') {
        anomalies.push({
          type: 'UNPAID_INVOICE',
          severity: 'HIGH',
          tenant: inv.tenant,
          description: `Facture ${inv.number} d'un montant de ${inv.totalAmount} XOF non rÃ©glÃ©e.`,
          referenceId: inv.id,
        });
      }
    });

    return {
      totalAnomaliesCount: anomalies.length,
      anomalies,
    };
  }

  /**
   * Exportation des donnÃ©es financiÃ¨res au format CSV sÃ©curisÃ©
   */
  async exportFinancialCsv(type: 'invoices' | 'payments' | 'tenants', query: SuperAdminBillingFilterDto) {
    await this.auditLogService.record({
      action: 'FINANCIAL_EXPORT',
      resourceType: 'FINANCIAL_CSV',
      resourceId: type.toUpperCase(),
      result: 'SUCCESS',
      metadata: { exportType: type, query },
    });

    if (type === 'tenants') {
      const res = await this.getTenantFinancials(query);
      const header = 'TenantCode,TenantName,Sector,BillingStatus,TotalBilled_XOF,TotalPaid_XOF,Outstanding_XOF\n';
      const rows = res.data
        .map((d: any) => `${d.code},"${d.name}",${d.sectorType},${d.billingStatus},${d.totalBilled},${d.totalPaid},${d.totalOutstanding}`)
        .join('\n');
      return header + rows;
    }

    if (type === 'payments') {
      const proofs = await this.prisma.withoutTenantScope(async (c) =>
        c.paymentProof.findMany({ where: { tenant: { isDemo: false } }, include: { tenant: true }, orderBy: { submittedAt: 'desc' } }),
      );
      const header = 'ID,TenantCode,Amount_XOF,Status,PaymentMethod,TransactionRef,CreatedAt\n';
      const rows = proofs
        .map((p: any) => `${p.id},${p.tenant.code},${p.amount},${p.status},${p.paymentMethod},"${p.transactionRef || ''}",${p.submittedAt.toISOString()}`)
        .join('\n');
      return header + rows;
    }

    // Default: invoices
    const invoices = await this.prisma.withoutTenantScope(async (c) =>
      c.invoice.findMany({ where: { tenant: { isDemo: false } }, include: { tenant: true }, orderBy: { createdAt: 'desc' } }),
    );
    const header = 'InvoiceNumber,TenantCode,ClientName,TotalAmount_XOF,Status,CreatedAt\n';
    const rows = invoices
      .map((i: any) => `${i.number},${i.tenant.code},"${i.clientName}",${i.totalAmount},${i.status},${i.createdAt.toISOString()}`)
      .join('\n');
    return header + rows;
  }
}



