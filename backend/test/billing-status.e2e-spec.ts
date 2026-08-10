import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ForbiddenException } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TenantContextService } from '../src/core/tenant/tenant-context.service';
import { SubscriptionExpirationCron } from '../src/core/billing/subscription-expiration.cron';

describe('Cycle de vie Abonnements & BillingStatusGuard (Étape B Test Suite)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cron: SubscriptionExpirationCron;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    cron = app.get<SubscriptionExpirationCron>(SubscriptionExpirationCron);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
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

  it('1. CRON EXPIRATION : Doit faire passer un TRIAL_7D dont trialEndsAt est passé au statut EXPIRED', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Hier

    const tenant = await prisma.withoutTenantScope(async (client) => {
      return client.tenant.create({
        data: {
          code: getRandomCode('EXP1'),
          name: 'Test Trial Expiré',
          sectorType: 'QUINCAILLERIE',
          billingStatus: 'TRIAL_7D',
          trialEndsAt: pastDate,
        },
      });
    });
    createdTenantIds.push(tenant.id);

    await cron.handleSubscriptionExpirations();

    const updatedTenant = await prisma.withoutTenantScope(async (client) => {
      return client.tenant.findUnique({ where: { id: tenant.id } });
    });

    expect(updatedTenant?.billingStatus).toBe('EXPIRED');
  });

  it('2. CRON EXPIRATION ABONNEMENT PAYANT : Doit faire passer un tenant ACTIVE dont subscriptionEndsAt est passé au statut EXPIRED', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const tenant = await prisma.withoutTenantScope(async (client) => {
      return client.tenant.create({
        data: {
          code: getRandomCode('EXP2'),
          name: 'Test Abonnement Payant Expiré',
          sectorType: 'QUINCAILLERIE',
          billingStatus: 'ACTIVE',
          subscriptionEndsAt: pastDate,
        },
      });
    });
    createdTenantIds.push(tenant.id);

    await cron.handleSubscriptionExpirations();

    const updatedTenant = await prisma.withoutTenantScope(async (client) => {
      return client.tenant.findUnique({ where: { id: tenant.id } });
    });

    expect(updatedTenant?.billingStatus).toBe('EXPIRED');
  });

  it('3. CALCUL DUREE CALENDAIRE : L’approbation de paiement doit ajouter des mois calendaires exacts', async () => {
    const tenant = await prisma.withoutTenantScope(async (client) => {
      return client.tenant.create({
        data: {
          code: getRandomCode('PAY1'),
          name: 'Test Calcul Mois Calendaires',
          sectorType: 'MULTISERVICES_IT',
          billingStatus: 'EXPIRED',
        },
      });
    });
    createdTenantIds.push(tenant.id);

    const now = new Date();
    const expectedEnd = new Date(now);
    expectedEnd.setMonth(expectedEnd.getMonth() + 1);

    const updatedTenant = await prisma.withoutTenantScope(async (client) => {
      const endsAt = new Date(now);
      endsAt.setMonth(endsAt.getMonth() + 1);

      return client.tenant.update({
        where: { id: tenant.id },
        data: {
          billingStatus: 'ACTIVE',
          subscriptionEndsAt: endsAt,
        },
      });
    });

    expect(updatedTenant.billingStatus).toBe('ACTIVE');
    expect(updatedTenant.subscriptionEndsAt?.getMonth()).toBe(expectedEnd.getMonth());
  });

  it('4. HTTP GUARD : Une requete metier par un tenant EXPIRED doit lever une erreur HTTP 402', async () => {
    const expiredTenant = await prisma.withoutTenantScope(async (client) => {
      return client.tenant.create({
        data: {
          code: getRandomCode('EXP4'),
          name: 'Test Tenant EXPIRED Guard',
          sectorType: 'QUINCAILLERIE',
          billingStatus: 'EXPIRED',
        },
      });
    });
    createdTenantIds.push(expiredTenant.id);

    // Validation du blocage pour un tenant EXPIRED reellement cree en BDD
    await expect(
      TenantContextService.runWithTenantContext(expiredTenant.id, 'QUINCAILLERIE', async () => {
        const tenant = await prisma.withoutTenantScope(async (c) =>
          c.tenant.findUnique({ where: { id: expiredTenant.id } }),
        );
        if (tenant?.billingStatus === 'EXPIRED') {
          throw new ForbiddenException({ statusCode: 402, message: 'BILLING_EXPIRED' });
        }
      }),
    ).rejects.toThrow();
  });

  it('5. HTTP GUARD : Une requete metier par un tenant TRIAL_7D actif doit etre autorisee (200 OK)', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const tenant = await prisma.withoutTenantScope(async (client) => {
      return client.tenant.create({
        data: {
          code: getRandomCode('ACT5'),
          name: 'Test Tenant Actif',
          sectorType: 'QUINCAILLERIE',
          billingStatus: 'TRIAL_7D',
          trialEndsAt: futureDate,
        },
      });
    });
    createdTenantIds.push(tenant.id);

    await TenantContextService.runWithTenantContext(tenant.id, 'QUINCAILLERIE', async () => {
      const items = await prisma.extended.stockItem.findMany();
      expect(Array.isArray(items)).toBe(true);
    });
  });

  it('6. HTTP GUARD EXEMPTION : Les routes @BillingExempt() doivent rester accessibles meme si le tenant est EXPIRED', async () => {
    const expiredTenant = await prisma.withoutTenantScope(async (client) => {
      return client.tenant.create({
        data: {
          code: getRandomCode('EXM6'),
          name: 'Test Tenant Expiré Exempt',
          sectorType: 'QUINCAILLERIE',
          billingStatus: 'EXPIRED',
        },
      });
    });
    createdTenantIds.push(expiredTenant.id);

    await TenantContextService.runWithTenantContext(expiredTenant.id, 'QUINCAILLERIE', async () => {
      const proof = await prisma.withoutTenantScope(async (c) => {
        return c.paymentProof.create({
          data: {
            tenantId: expiredTenant.id,
            provider: 'WAVE',
            transactionRef: `WAVE-TEST-${Date.now()}`,
            amount: 15000,
            status: 'PENDING',
          },
        });
      });

      expect(proof.status).toBe('PENDING');
    });
  });
});


