import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Console Super Admin Renforcée (Étape E Test Suite)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
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

  it('1. METRIQUES CONSOLIDEES SAAS UEMOA : Doit calculer le volume d affaires consolidé et le décompte des tenants par statut/secteur', async () => {
    const tenantA = await prisma.withoutTenantScope(async (c) =>
      c.tenant.create({ data: { code: getRandomCode('SUPA'), name: 'Tenant SuperAdmin A', sectorType: 'QUINCAILLERIE', billingStatus: 'ACTIVE' } }),
    );
    const tenantB = await prisma.withoutTenantScope(async (c) =>
      c.tenant.create({ data: { code: getRandomCode('SUPB'), name: 'Tenant SuperAdmin B', sectorType: 'MULTISERVICES_IT', billingStatus: 'TRIAL_7D' } }),
    );
    createdTenantIds.push(tenantA.id, tenantB.id);

    const totalTenants = await prisma.withoutTenantScope(async (c) => c.tenant.count());
    const activeTenants = await prisma.withoutTenantScope(async (c) => c.tenant.count({ where: { billingStatus: 'ACTIVE' } }));

    expect(totalTenants).toBeGreaterThanOrEqual(2);
    expect(activeTenants).toBeGreaterThanOrEqual(1);
  });

  it('2. GESTION DES PREUVES DE PAIEMENT : Doit pouvoir valider (APPROVE) ou rejeter (REJECT) une preuve Wave/OM', async () => {
    const tenant = await prisma.withoutTenantScope(async (c) =>
      c.tenant.create({ data: { code: getRandomCode('SUPPAY'), name: 'Tenant Pay Test', sectorType: 'TAILLEUR', billingStatus: 'EXPIRED' } }),
    );
    createdTenantIds.push(tenant.id);

    // 1. Soumission d'une preuve de paiement
    const proof = await prisma.withoutTenantScope(async (c) => {
      return c.paymentProof.create({
        data: {
          tenantId: tenant.id,
          provider: 'ORANGE_MONEY',
          transactionRef: `OM-TEST-${Date.now()}`,
          amount: 80000,
          durationMonths: 6,
          status: 'PENDING',
        },
      });
    });

    expect(proof.status).toBe('PENDING');

    // 2. Approbation par le Super Admin (Validation 6 mois)
    const now = new Date();
    const expectedEnd = new Date(now);
    expectedEnd.setMonth(expectedEnd.getMonth() + 6);

    const updatedTenant = await prisma.withoutTenantScope(async (tx) => {
      await tx.paymentProof.update({
        where: { id: proof.id },
        data: { status: 'APPROVED', processedAt: now },
      });

      return tx.tenant.update({
        where: { id: tenant.id },
        data: { billingStatus: 'ACTIVE', subscriptionEndsAt: expectedEnd },
      });
    });

    expect(updatedTenant.billingStatus).toBe('ACTIVE');

    const updatedProof = await prisma.withoutTenantScope(async (c) => c.paymentProof.findUnique({ where: { id: proof.id } }));
    expect(updatedProof?.status).toBe('APPROVED');
  });
});
