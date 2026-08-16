import { Test, TestingModule } from '@nestjs/testing';
import { SuperAdminBillingService } from './super-admin-billing.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingCalculatorService } from '../billing/pricing-calculator.service';
import { AuditLogService } from './audit-log.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { ForbiddenException } from '@nestjs/common';

describe('SuperAdminBillingService (Financial Aggregation & Security)', () => {
  let service: SuperAdminBillingService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      withoutTenantScope: jest.fn((callback) => callback(prismaService)),
      invoice: {
        findMany: jest.fn().mockResolvedValue([
          { totalAmount: 100000, status: 'PAID' },
          { totalAmount: 50000, status: 'UNPAID' },
        ]),
      },
      paymentProof: {
        findMany: jest.fn().mockResolvedValue([
          { amount: 100000, status: 'APPROVED' },
          { amount: 20000, status: 'PENDING' },
        ]),
      },
      tenant: {
        findMany: jest.fn().mockImplementation((args) => {
          if (args?.where?.billingStatus === 'ACTIVE') {
            return Promise.resolve([{ id: 'tenant-1' }, { id: 'tenant-2' }]);
          }
          return Promise.resolve([{ id: 'tenant-1' }, { id: 'tenant-2' }, { id: 'tenant-3' }]);
        }),

        count: jest.fn().mockResolvedValue(3),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminBillingService,
        { provide: PrismaService, useValue: prismaService },
        {
          provide: PricingCalculatorService,
          useValue: {
            getPricingConfig: jest.fn().mockResolvedValue({
              baseMonthlyPrice: 6500,
              currency: 'XOF',
            }),
          },
        },
        { provide: AuditLogService, useValue: { record: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = module.get<SuperAdminBillingService>(SuperAdminBillingService);
  });

  it('1. Calcul exact des agregations financieres (CA Facture, Encaisse, MRR, ARR)', async () => {
    jest.spyOn(TenantContextService, 'getStore').mockReturnValue({
      isSuperAdmin: true,
    } as any);

    const result = await service.getFinancialOverview({});
    expect(result.metrics.billedTotal).toBe(150000);
    expect(result.metrics.collectedTotal).toBe(100000);
    expect(result.metrics.receivablesTotal).toBe(50000);
    expect(result.metrics.mrr).toBe(13000); // 2 active tenants * 6500 XOF
    expect(result.metrics.arr).toBe(156000); // 13000 * 12
  });

  it('2. Securite RBAC : Refuse l\'accès au dashboard financier global pour un utilisateur non Super Admin', async () => {
    jest.spyOn(TenantContextService, 'getStore').mockReturnValue({
      tenantId: 'tenant-1',
      isSuperAdmin: false,
    } as any);

    await expect(service.getFinancialOverview({})).rejects.toThrow(ForbiddenException);
  });
});
