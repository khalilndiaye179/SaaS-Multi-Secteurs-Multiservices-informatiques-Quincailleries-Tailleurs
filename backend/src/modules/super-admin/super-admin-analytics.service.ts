import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SuperAdminBillingService } from './super-admin-billing.service';
import { AuditLogService } from './audit-log.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { SuperAdminAnalyticsFilterDto } from './dto/super-admin-analytics.dto';
import { Prisma } from '@prisma/client';

export interface KpiStructure<T> {
  value: T | null;
  previousValue?: T | null;
  variation?: number | null;
  unit?: string;
  currency?: string;
  status: 'AVAILABLE' | 'INSUFFICIENT_DATA' | 'NOT_APPLICABLE';
  period?: string;
  explanation?: string;
}

@Injectable()
export class SuperAdminAnalyticsService {
  constructor(
    private prisma: PrismaService,
    private billingService: SuperAdminBillingService,
    private auditLogService: AuditLogService,
  ) {}

  private parseDateBounds(dateFrom?: string, dateTo?: string) {
    let from: Date | undefined;
    let to: Date | undefined;

    if (dateFrom) {
      from = new Date(dateFrom);
      if (isNaN(from.getTime())) throw new BadRequestException('Format dateFrom invalide.');
    }

    if (dateTo) {
      to = new Date(dateTo);
      if (isNaN(to.getTime())) throw new BadRequestException('Format dateTo invalide.');
    }

    return { from, to };
  }

  /**
   * Calcul du Taux de Croissance des Tenants avec comparaison sur la période précédente
   */
  async getTenantGrowth(query: SuperAdminAnalyticsFilterDto): Promise<KpiStructure<number>> {
    const store = TenantContextService.getStore();
    if (!store?.isSuperAdmin) throw new ForbiddenException('Accès réservé au Super Admin.');

    const { from, to } = this.parseDateBounds(query.dateFrom, query.dateTo);
    const now = new Date();
    const endDate = to || now;
    const startDate = from || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const durationMs = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - durationMs);
    const prevEndDate = new Date(startDate.getTime());

    const [currentCount, previousCount] = await this.prisma.withoutTenantScope(async (c) =>
      Promise.all([
        c.tenant.count({ where: { isDemo: false, createdAt: { gte: startDate, lte: endDate } } }),
        c.tenant.count({ where: { isDemo: false, createdAt: { gte: prevStartDate, lte: prevEndDate } } }),
      ]),
    );

    if (previousCount === 0) {
      return {
        value: currentCount,
        previousValue: 0,
        variation: currentCount > 0 ? 100 : 0,
        unit: 'tenants',
        status: 'AVAILABLE',
        explanation: 'Aucune donnée d\'acquisition sur la période précédente comparable.',
      };
    }

    const growthRate = Math.round(((currentCount - previousCount) / previousCount) * 100 * 100) / 100;

    return {
      value: currentCount,
      previousValue: previousCount,
      variation: growthRate,
      unit: 'tenants',
      status: 'AVAILABLE',
    };
  }

  /**
   * Calcul strict du Churn Rate avec gestion Fail-Safe des historiques insuffisants
   */
  async getChurnRate(query: SuperAdminAnalyticsFilterDto): Promise<KpiStructure<number>> {
    const { from, to } = this.parseDateBounds(query.dateFrom, query.dateTo);
    const startDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to || new Date();

    // Un client "perdu" est un tenant dont le statut de facturation est EXPIRED ou SUSPENDED depuis la date de début
    const [startActiveCount, lostCount] = await this.prisma.withoutTenantScope(async (c) =>
      Promise.all([
        c.tenant.count({ where: { isDemo: false, createdAt: { lte: startDate }, billingStatus: 'ACTIVE' } }),
        c.tenant.count({ where: { isDemo: false, billingStatus: { in: ['EXPIRED', 'SUSPENDED'] }, subscriptionEndsAt: { gte: startDate, lte: endDate } } }),
      ]),
    );

    if (startActiveCount === 0) {
      return {
        value: null,
        status: 'INSUFFICIENT_DATA',
        explanation: 'Historique insuffisant d\'abonnements actifs au début de la période pour calculer un Churn Rate fiable.',
      };
    }

    const churnRate = Math.round((lostCount / startActiveCount) * 100 * 100) / 100;

    return {
      value: churnRate,
      unit: '%',
      status: 'AVAILABLE',
      explanation: `${lostCount} tenant(s) inactif(s) sur ${startActiveCount} tenant(s) actif(s) en début de période.`,
    };
  }

  /**
   * Calcul strict de l'ARPU (Average Revenue Per User) via la source unique de vérité financière
   */
  async getArpu(query: SuperAdminAnalyticsFilterDto): Promise<KpiStructure<number>> {
    const overview = await this.billingService.getFinancialOverview(query);
    const activePayingCount = overview.metrics.activeSubscriptionsCount;

    if (activePayingCount === 0) {
      return {
        value: 0,
        currency: overview.currency,
        status: 'AVAILABLE',
        explanation: 'Aucun abonnement payant actif actuellement.',
      };
    }

    const mrr = new Prisma.Decimal(overview.metrics.mrr);
    const arpuDecimal = mrr.div(activePayingCount);
    const arpu = Math.round(arpuDecimal.toNumber());

    return {
      value: arpu,
      currency: overview.currency,
      status: 'AVAILABLE',
      explanation: 'MRR total divisé par le nombre de tenants actifs.',
    };
  }

  /**
   * Calcul de la LTV (Lifetime Value) ou retour d'absence de données
   */
  async getLtv(query: SuperAdminAnalyticsFilterDto): Promise<KpiStructure<number>> {
    const arpuKpi = await this.getArpu(query);
    const churnKpi = await this.getChurnRate(query);

    if (
      arpuKpi.status !== 'AVAILABLE' ||
      churnKpi.status !== 'AVAILABLE' ||
      !arpuKpi.value ||
      !churnKpi.value ||
      churnKpi.value === 0
    ) {
      return {
        value: null,
        status: 'INSUFFICIENT_DATA',
        explanation: 'La LTV nécessite un Churn Rate strictement supérieur à 0 et un historique statistique étendu.',
      };
    }

    const churnDecimal = churnKpi.value / 100;
    const ltv = Math.round(arpuKpi.value / churnDecimal);

    return {
      value: ltv,
      currency: arpuKpi.currency,
      status: 'AVAILABLE',
    };
  }

  /**
   * Statistiques par Secteur (Quincaillerie, Multiservices IT, Tailleur)
   */
  async getSectorAnalytics() {
    const store = TenantContextService.getStore();
    if (!store?.isSuperAdmin) throw new ForbiddenException('Accès réservé au Super Admin.');

    const pricingConfig = await this.billingService.getFinancialOverview({});
    const basePrice = pricingConfig.metrics.mrr / (pricingConfig.metrics.activeSubscriptionsCount || 1);

    const sectors = await this.prisma.withoutTenantScope(async (c) =>
      c.tenant.groupBy({
        where: { isDemo: false },
        by: ['sectorType'],
        _count: { id: true },
      }),
    );

    const result = await Promise.all(
      sectors.map(async (sec) => {
        const activeCount = await this.prisma.withoutTenantScope(async (c) =>
          c.tenant.count({ where: { isDemo: false, sectorType: sec.sectorType, billingStatus: 'ACTIVE' } }),
        );
        const sectorMrr = activeCount * basePrice;

        return {
          sectorType: sec.sectorType,
          totalTenants: sec._count.id,
          activeTenants: activeCount,
          estimatedMrr: sectorMrr,
        };
      }),
    );

    return { currency: 'XOF', sectors: result };
  }

  /**
   * Audience & Visites Anonymisées sur PlatformAnalytics
   */
  async getAudienceAnalytics(query: SuperAdminAnalyticsFilterDto) {
    const store = TenantContextService.getStore();
    if (!store?.isSuperAdmin) throw new ForbiddenException('Accès réservé au Super Admin.');

    const { from, to } = this.parseDateBounds(query.dateFrom, query.dateTo);
    const where: any = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const [totalPageViews, sessionsGroup, topRoutesGroup, devicesGroup] = await this.prisma.withoutTenantScope(async (c) =>
      Promise.all([
        c.platformAnalytics.count({ where }),
        c.platformAnalytics.groupBy({ by: ['sessionId'], where }),
        c.platformAnalytics.groupBy({ by: ['route'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10, where }),
        c.platformAnalytics.groupBy({ by: ['deviceType'], _count: { id: true }, where }),
      ]),
    );

    await this.auditLogService.record({
      action: 'SUPER_ADMIN_ANALYTICS_VIEW',
      resourceType: 'AUDIENCE_ANALYTICS',
      resourceId: 'PLATFORM_AUDIENCE',
      result: 'SUCCESS',
    });

    return {
      metrics: {
        pageViews: totalPageViews,
        sessionsCount: sessionsGroup.length,
        uniqueVisitors: {
          value: null,
          status: 'NOT_APPLICABLE',
          explanation: 'PlatformAnalytics ne collecte aucun identifiant visiteur persistant (vie privée & GDPR).',
        },
      },
      topRoutes: topRoutesGroup.map((r) => ({ route: r.route, views: r._count.id })),
      deviceBreakdown: devicesGroup.map((d) => ({ deviceType: d.deviceType || 'UNKNOWN', count: d._count.id })),
    };
  }

  /**
   * Acquisition Time Series (Nouveaux Tenants par mois/semaine)
   */
  async getAcquisitionTimeSeries(query: SuperAdminAnalyticsFilterDto) {
    const store = TenantContextService.getStore();
    if (!store?.isSuperAdmin) throw new ForbiddenException('Accès réservé au Super Admin.');

    const { from, to } = this.parseDateBounds(query.dateFrom, query.dateTo);
    const startDate = from || new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const endDate = to || new Date();

    // Récupérer tous les tenants créés dans la période
    const tenants = await this.prisma.withoutTenantScope(async (c) =>
      c.tenant.findMany({
        where: { isDemo: false, createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      })
    );

    // Grouper par mois "YYYY-MM"
    const grouped = tenants.reduce((acc, t) => {
      const monthYear = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, '0')}`;
      acc[monthYear] = (acc[monthYear] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(grouped).map(date => ({
      date,
      newTenants: grouped[date]
    }));
  }

  /**
   * Revenue Time Series (Approximation du MRR basé sur l'acquisition de tenants ACTIFS)
   */
  async getRevenueTimeSeries(query: SuperAdminAnalyticsFilterDto) {
    const store = TenantContextService.getStore();
    if (!store?.isSuperAdmin) throw new ForbiddenException('Accès réservé au Super Admin.');

    const { from, to } = this.parseDateBounds(query.dateFrom, query.dateTo);
    const startDate = from || new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const endDate = to || new Date();

    const [invoices, proofs] = await this.prisma.withoutTenantScope(async (c) =>
      Promise.all([
        c.invoice.findMany({
          where: { tenant: { isDemo: false }, createdAt: { gte: startDate, lte: endDate } },
          select: { createdAt: true, totalAmount: true }
        }),
        c.paymentProof.findMany({
          where: { tenant: { isDemo: false }, status: 'APPROVED', processedAt: { gte: startDate, lte: endDate } },
          select: { processedAt: true, submittedAt: true, amount: true }
        })
      ])
    );

    const grouped: Record<string, { billed: Prisma.Decimal; collected: Prisma.Decimal }> = {};

    // 1. Group Invoices (Billed)
    invoices.forEach((inv) => {
      const monthYear = `${inv.createdAt.getFullYear()}-${String(inv.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[monthYear]) grouped[monthYear] = { billed: new Prisma.Decimal(0), collected: new Prisma.Decimal(0) };
      grouped[monthYear].billed = grouped[monthYear].billed.add(new Prisma.Decimal(inv.totalAmount || 0));
    });

    // 2. Group PaymentProofs (Collected)
    proofs.forEach((prf) => {
      const dateObj = prf.processedAt || prf.submittedAt;
      if (!dateObj) return;
      const monthYear = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[monthYear]) grouped[monthYear] = { billed: new Prisma.Decimal(0), collected: new Prisma.Decimal(0) };
      grouped[monthYear].collected = grouped[monthYear].collected.add(new Prisma.Decimal(prf.amount || 0));
    });

    const sortedKeys = Object.keys(grouped).sort();
    
    let cumulativeBilled = new Prisma.Decimal(0);
    let cumulativeCollected = new Prisma.Decimal(0);

    const timeSeries = sortedKeys.map(date => {
      cumulativeBilled = cumulativeBilled.add(grouped[date].billed);
      cumulativeCollected = cumulativeCollected.add(grouped[date].collected);

      return {
        date,
        billed: {
          monthly: grouped[date].billed.toNumber(),
          cumulative: cumulativeBilled.toNumber(),
        },
        collected: {
          monthly: grouped[date].collected.toNumber(),
          cumulative: cumulativeCollected.toNumber(),
        }
      };
    });

    return timeSeries;
  }
}
