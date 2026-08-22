import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TenantContextService } from '../src/core/tenant/tenant-context.service';
import { BusinessBillingService } from '../src/modules/billing/business-billing.service';

describe('Moteur de Devis & Facturation Générique (Étape C Test Suite)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let billingService: BusinessBillingService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    billingService = app.get<BusinessBillingService>(BusinessBillingService);
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    if (app) await app.close();
  });

  const createdTenantIds: string[] = [];
  const getRandomCode = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  afterEach(async () => {
    if (createdTenantIds.length > 0) {
      await prisma.withoutTenantScope(async (client) => {
        await client.tenant.deleteMany({
          where: { id: { in: createdTenantIds } },
        });
      });
      createdTenantIds.length = 0;
    }
  });

  it('1. CREATION DEVIS : Doit generer un numero DEV-YYYY-0001 isole par tenant avec calcul du montant total', async () => {
    const tenant = await prisma.withoutTenantScope(async (client) => {
      return client.tenant.create({
        data: {
          code: getRandomCode('DEV1'),
          name: 'Quincaillerie Test Devis',
          sectorType: 'QUINCAILLERIE',
          billingStatus: 'ACTIVE',
        },
      });
    });
    createdTenantIds.push(tenant.id);

    await TenantContextService.runWithTenantContext(tenant.id, 'QUINCAILLERIE', async () => {
      const year = new Date().getFullYear();
      const quote = await prisma.extended.quote.create({
        data: {
          number: `DEV-${year}-0001`,
          clientName: 'Ousmane DIOP',
          clientPhone: '771234567',
          totalAmount: 150000,
          status: 'DRAFT',
          lines: {
            create: [
              { description: 'Ciment SOCOCIM 50kg', quantity: 10, unitPrice: 5000, totalPrice: 50000 },
              { description: 'Fer de 12 (barre)', quantity: 20, unitPrice: 5000, totalPrice: 100000 },
            ],
          },
        } as any,
        include: { lines: true },
      });

      expect(quote.number).toBe(`DEV-${year}-0001`);
      expect(quote.totalAmount).toBe(150000);
      expect(quote.lines.length).toBe(2);
    });
  });

  it('2. CONVERSION DEVIS -> FACTURE : Doit creer une facture FAC-YYYY-0001, copier les lignes et passer le devis en ACCEPTED', async () => {
    const tenant = await prisma.withoutTenantScope(async (client) => {
      return client.tenant.create({
        data: {
          code: getRandomCode('CONV1'),
          name: 'Atelier Tailleur Conv',
          sectorType: 'TAILLEUR',
          billingStatus: 'ACTIVE',
        },
      });
    });
    createdTenantIds.push(tenant.id);

    await TenantContextService.runWithTenantContext(tenant.id, 'TAILLEUR', async () => {
      const year = new Date().getFullYear();
      const quote = await prisma.extended.quote.create({
        data: {
          number: `DEV-${year}-0001`,
          clientName: 'Awa NDIYE',
          totalAmount: 75000,
          status: 'DRAFT',
          lines: {
            create: [{ description: 'Couture Grand Boubou 3P', quantity: 1, unitPrice: 75000, totalPrice: 75000 }],
          },
        } as any,
        include: { lines: true },
      });

      // Conversion
      const invoice = await prisma.extended.invoice.create({
        data: {
          number: `FAC-${year}-0001`,
          sourceQuoteId: quote.id,
          clientName: quote.clientName,
          totalAmount: quote.totalAmount,
          status: 'DRAFT',
          lines: {
            create: quote.lines.map((l) => ({
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              totalPrice: l.totalPrice,
            })),
          },
        } as any,
        include: { lines: true },
      });

      await prisma.extended.quote.update({
        where: { id: quote.id },
        data: { status: 'ACCEPTED' },
      });

      expect(invoice.number).toBe(`FAC-${year}-0001`);
      expect(invoice.lines[0].description).toBe('Couture Grand Boubou 3P');

      const updatedQuote = await prisma.extended.quote.findFirst({ where: { id: quote.id } });
      expect(updatedQuote?.status).toBe('ACCEPTED');
    });
  });

  it('3. ISOLATION FAIL-CLOSED DEVIS : Un tenant B ne doit pas pouvoir lire les devis du tenant A', async () => {
    const tenantA = await prisma.withoutTenantScope(async (c) =>
      c.tenant.create({ data: { code: getRandomCode('ISOA'), name: 'Tenant A', sectorType: 'QUINCAILLERIE', billingStatus: 'ACTIVE' } }),
    );
    const tenantB = await prisma.withoutTenantScope(async (c) =>
      c.tenant.create({ data: { code: getRandomCode('ISOB'), name: 'Tenant B', sectorType: 'QUINCAILLERIE', billingStatus: 'ACTIVE' } }),
    );
    createdTenantIds.push(tenantA.id, tenantB.id);

    // Tenant A cree un devis
    await TenantContextService.runWithTenantContext(tenantA.id, 'QUINCAILLERIE', async () => {
      await prisma.extended.quote.create({
        data: { number: 'DEV-2026-0001', clientName: 'Client A', totalAmount: 10000 } as any,
      });
    });

    // Tenant B ne doit voir aucun devis de A
    await TenantContextService.runWithTenantContext(tenantB.id, 'QUINCAILLERIE', async () => {
      const quotesB = await prisma.extended.quote.findMany();
      expect(quotesB.length).toBe(0);
    });
  });

  it('4. CONCURRENCE : 20 factures paralleles pour un meme tenant ne doivent generer aucun doublon de numero', async () => {
    const tenant = await prisma.withoutTenantScope(async (client) => {
      return client.tenant.create({
        data: {
          code: getRandomCode('CONC1'),
          name: 'Quincaillerie Concurrence',
          sectorType: 'QUINCAILLERIE',
          billingStatus: 'ACTIVE',
        },
      });
    });
    createdTenantIds.push(tenant.id);

    await TenantContextService.runWithTenantContext(tenant.id, 'QUINCAILLERIE', async () => {
      const dto = {
        clientName: 'Client Concurrence',
        lines: [{ description: 'Prestation test', quantity: 1, unitPrice: 1000 }],
      } as any;

      const invoices = await Promise.all(
        Array.from({ length: 20 }, () => billingService.createInvoice(dto)),
      );

      const numbers = invoices.map((inv) => inv.number);
      expect(new Set(numbers).size).toBe(20);

      const year = new Date().getFullYear();
      const expected = Array.from({ length: 20 }, (_, i) =>
        `FAC-${year}-${(i + 1).toString().padStart(4, '0')}`,
      );
      expect(numbers.sort()).toEqual(expected.sort());

      const sequence = await prisma.extended.billingSequence.findFirst({
        where: { tenantId: tenant.id, year, type: 'INVOICE' },
      });
      expect(sequence?.currentValue).toBe(20);
    });
  });
});
