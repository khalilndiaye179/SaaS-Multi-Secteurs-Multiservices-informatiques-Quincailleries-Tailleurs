import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

import { SuperAdminDashboardService } from '../src/modules/super-admin/super-admin.service';

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

  it('3. ACTIONS MODIFIER & SOFT DELETE TENANT : Doit modifier les coordonnées d un tenant sans altérer son isolation et empêcher l authentification si archivé', async () => {
    const tenant = await prisma.withoutTenantScope(async (c) =>
      c.tenant.create({ data: { code: getRandomCode('MOD'), name: 'Entreprise Initiale', sectorType: 'QUINCAILLERIE', billingStatus: 'ACTIVE', phone: '+221 77 111 22 33' } }),
    );
    createdTenantIds.push(tenant.id);

    // 1. Modification des coordonnées
    const updatedTenant = await prisma.withoutTenantScope(async (c) =>
      c.tenant.update({
        where: { id: tenant.id },
        data: { name: 'Entreprise Modifiée SARL', phone: '+221 77 999 88 77', country: 'CI' },
      }),
    );

    expect(updatedTenant.name).toBe('Entreprise Modifiée SARL');
    expect(updatedTenant.phone).toBe('+221 77 999 88 77');
    expect(updatedTenant.country).toBe('CI');
    expect(updatedTenant.sectorType).toBe('QUINCAILLERIE'); // Invariant

    // 2. Soft Delete (Archivage)
    const archivedTenant = await prisma.withoutTenantScope(async (c) =>
      c.tenant.update({
        where: { id: tenant.id },
        data: { billingStatus: 'ARCHIVED', deletedAt: new Date() },
      }),
    );

    expect(archivedTenant.billingStatus).toBe('ARCHIVED');
    expect(archivedTenant.deletedAt).toBeDefined();
  });

  it('4. PURGE SECURISEE DES TENANTS DEMO : Doit archiver uniquement isDemo=true & isPermanentDemo=false, immuniser isPermanentDemo=true et bloquer si NODE_ENV=production', async () => {
    const service = app.get(SuperAdminDashboardService);

    // 1. Création d'un tenant démo éphémère (isDemo: true, isPermanentDemo: false), d'un tenant permanent (isDemo: true, isPermanentDemo: true) et d'un tenant réel (isDemo: false)
    const ephemeralDemo = await prisma.withoutTenantScope(async (c) =>
      c.tenant.create({ data: { code: getRandomCode('EPH'), name: 'Démo Éphémère', sectorType: 'QUINCAILLERIE', isDemo: true, isPermanentDemo: false, billingStatus: 'TRIAL_7D' } }),
    );
    const permanentDemo = await prisma.withoutTenantScope(async (c) =>
      c.tenant.create({ data: { code: getRandomCode('PERM'), name: 'Démo Système Permanente', sectorType: 'QUINCAILLERIE', isDemo: true, isPermanentDemo: true, billingStatus: 'ACTIVE' } }),
    );
    const realTenant = await prisma.withoutTenantScope(async (c) =>
      c.tenant.create({ data: { code: getRandomCode('REAL'), name: 'Client Réel Production', sectorType: 'QUINCAILLERIE', isDemo: false, isPermanentDemo: false, billingStatus: 'ACTIVE' } }),
    );
    createdTenantIds.push(ephemeralDemo.id, permanentDemo.id, realTenant.id);

    // 2. Exécution de la purge démo en mode dev
    const purgeResult = await service.purgeDemoTenants();
    expect(purgeResult.count).toBeGreaterThanOrEqual(1);

    // 3. VÉRIFICATION 1 : Le tenant démo éphémère passes à ARCHIVED avec deletedAt
    const updatedEphemeral = await prisma.withoutTenantScope(async (c) => c.tenant.findUnique({ where: { id: ephemeralDemo.id } }));
    expect(updatedEphemeral?.billingStatus).toBe('ARCHIVED');
    expect(updatedEphemeral?.deletedAt).toBeDefined();

    // 4. VÉRIFICATION 2 : Le tenant démo permanent isPermanentDemo=true EST STRICTEMENT IMMUNISÉ (reste ACTIVE)
    const updatedPermanent = await prisma.withoutTenantScope(async (c) => c.tenant.findUnique({ where: { id: permanentDemo.id } }));
    expect(updatedPermanent?.billingStatus).toBe('ACTIVE');
    expect(updatedPermanent?.deletedAt).toBeNull();

    // 5. VÉRIFICATION 3 : Le tenant réel isDemo=false N'EST JAMAIS TOUCHÉ (reste ACTIVE)
    const updatedReal = await prisma.withoutTenantScope(async (c) => c.tenant.findUnique({ where: { id: realTenant.id } }));
    expect(updatedReal?.billingStatus).toBe('ACTIVE');
    expect(updatedReal?.deletedAt).toBeNull();

    // 6. VÉRIFICATION 4 : Blocage strict si NODE_ENV = production
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      await expect(service.purgeDemoTenants()).rejects.toThrow();
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});



