import { Test, TestingModule } from '@nestjs/testing';
import { SuperAdminAnalyticsService } from './super-admin-analytics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SuperAdminBillingService } from './super-admin-billing.service';
import { AuditLogService } from './audit-log.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { ForbiddenException } from '@nestjs/common';

describe('SuperAdminAnalyticsService (Growth, Churn, Audience & RBAC)', () => {
  let service: SuperAdminAnalyticsService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      withoutTenantScope: jest.fn((callback) => callback(prismaService)),
      tenant: {
        count: jest.fn(),
        groupBy: jest.fn().mockResolvedValue([
          { sectorType: 'QUINCAILLERIE', _count: { id: 5 } },
          { sectorType: 'MULTISERVICES_IT', _count: { id: 3 } },
        ]),
      },
      platformAnalytics: {
        count: jest.fn().mockResolvedValue(150),
        groupBy: jest.fn().mockImplementation((args) => {
          if (args.by.includes('sessionId')) return Promise.resolve([{ sessionId: 's1' }, { sessionId: 's2' }]);
          if (args.by.includes('route')) return Promise.resolve([{ route: '/dashboard', _count: { id: 100 } }]);
          return Promise.resolve([{ deviceType: 'DESKTOP', _count: { id: 120 } }]);
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminAnalyticsService,
        { provide: PrismaService, useValue: prismaService },
        {
          provide: SuperAdminBillingService,
          useValue: {
            getFinancialOverview: jest.fn().mockResolvedValue({
              currency: 'XOF',
              metrics: { mrr: 26000, activeSubscriptionsCount: 4 },
            }),
          },
        },
        { provide: AuditLogService, useValue: { record: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = module.get<SuperAdminAnalyticsService>(SuperAdminAnalyticsService);
  });

  it('1. Taux de Croissance des Tenants avec comparaison sur periode precedente (previousPeriod = 0 -> 100%)', async () => {
    jest.spyOn(TenantContextService, 'getStore').mockReturnValue({ isSuperAdmin: true } as any);

    prismaService.tenant.count
      .mockResolvedValueOnce(10) // Current count
      .mockResolvedValueOnce(0); // Previous count

    const growth = await service.getTenantGrowth({});
    expect(growth.value).toBe(10);
    expect(growth.previousValue).toBe(0);
    expect(growth.variation).toBe(100);
    expect(growth.status).toBe('AVAILABLE');
  });

  it('2. Churn Rate sans historique -> value: null et status: INSUFFICIENT_DATA', async () => {
    prismaService.tenant.count
      .mockResolvedValueOnce(0) // startActiveCount = 0
      .mockResolvedValueOnce(0);

    const churn = await service.getChurnRate({});
    expect(churn.value).toBeNull();
    expect(churn.status).toBe('INSUFFICIENT_DATA');
  });

  it('3. Audience : Distinction sessions / pages vues et uniqueVisitors avec status NOT_APPLICABLE', async () => {
    jest.spyOn(TenantContextService, 'getStore').mockReturnValue({ isSuperAdmin: true } as any);

    const audience = await service.getAudienceAnalytics({});
    expect(audience.metrics.pageViews).toBe(150);
    expect(audience.metrics.sessionsCount).toBe(2);
    expect(audience.metrics.uniqueVisitors.status).toBe('NOT_APPLICABLE');
  });

  it('4. RBAC Security : Un utilisateur non Super Admin ne peut pas acceder aux analytics globaux', async () => {
    jest.spyOn(TenantContextService, 'getStore').mockReturnValue({ tenantId: 't1', isSuperAdmin: false } as any);

    await expect(service.getTenantGrowth({})).rejects.toThrow(ForbiddenException);
  });
});
