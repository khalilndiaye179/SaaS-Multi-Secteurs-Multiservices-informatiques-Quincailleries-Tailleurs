import { Test, TestingModule } from '@nestjs/testing';
import { SaaSQuoteService } from './saas-quote.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingCalculatorService } from '../billing/pricing-calculator.service';
import { AuditLogService } from '../super-admin/audit-log.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('SaaSQuoteService (Commercial Quotes & Conversion)', () => {
  let service: SaaSQuoteService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      withoutTenantScope: jest.fn((callback) => callback(prismaService)),
      saaSQuote: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      tenant: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaService)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaaSQuoteService,
        { provide: PrismaService, useValue: prismaService },
        {
          provide: PricingCalculatorService,
          useValue: {
            calculatePrice: jest.fn().mockResolvedValue({
              grossAmount: 78000,
              savingsAmount: 15600,
              currency: 'XOF',
            }),
          },
        },
        { provide: AuditLogService, useValue: { record: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = module.get<SaaSQuoteService>(SaaSQuoteService);
  });

  it('1. Recalcul strict des montants financiers (Decimal) et generation de numero SQ-2026-0001', async () => {
    prismaService.saaSQuote.create.mockImplementation((args: any) => ({
      id: 'quote-1',
      ...args.data,
    }));

    const result = await service.create({
      clientName: 'Entreprise Test',
      clientEmail: 'client@test.sn',
      durationMonths: 12,
    });

    expect(result.quoteNumber).toMatch(/^SQ-\d{4}-0001$/);
    expect(result.subtotal.toNumber()).toBe(78000);
    expect(result.discount.toNumber()).toBe(15600);
    expect(result.total.toNumber()).toBe(62400);
  });

  it('2. Isolation Tenant : Refuse l\'acces a un devis d\'un autre tenant pour un utilisateur non Super Admin', async () => {
    jest.spyOn(TenantContextService, 'getStore').mockReturnValue({
      tenantId: 'tenant-a',
      isSuperAdmin: false,
    } as any);

    prismaService.saaSQuote.findUnique.mockResolvedValue({
      id: 'quote-b',
      tenantId: 'tenant-b',
    });

    await expect(service.findOne('quote-b')).rejects.toThrow(ForbiddenException);
  });

  it('3. Conversion Idempotente : Empeche une deuxieme conversion d\'un devis deja converti', async () => {
    jest.spyOn(TenantContextService, 'getStore').mockReturnValue({
      isSuperAdmin: true,
    } as any);

    prismaService.saaSQuote.findUnique.mockResolvedValue({
      id: 'quote-1',
      status: 'CONVERTED',
      tenantId: 'tenant-a',
    });

    await expect(service.convertToSubscription('quote-1')).rejects.toThrow(ConflictException);
  });
});
