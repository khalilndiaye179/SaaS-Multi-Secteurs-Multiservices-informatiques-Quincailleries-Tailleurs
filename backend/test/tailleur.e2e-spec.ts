import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, NotFoundException } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TenantContextService } from '../src/core/tenant/tenant-context.service';
import { TailleurMeasurementService } from '../src/modules/tailleur/tailleur-measurement.service';

describe('Module Tailleur / Couture Complété (Étape D3 Test Suite)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let measurementService: TailleurMeasurementService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    measurementService = app.get<TailleurMeasurementService>(TailleurMeasurementService);
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

  it('1. MESURES SUR MESURE & COMMANDE : Doit créer une fiche client JSON et une commande CMD-YYYY-0001', async () => {
    const tenant = await prisma.withoutTenantScope(async (c) =>
      c.tenant.create({ data: { code: getRandomCode('TLR1'), name: 'Atelier Couture Thiès', sectorType: 'TAILLEUR', billingStatus: 'ACTIVE' } }),
    );
    createdTenantIds.push(tenant.id);

    await TenantContextService.runWithTenantContext(tenant.id, 'TAILLEUR', async () => {
      const year = new Date().getFullYear();

      // 1. Fiche de mesures JSON
      const measurement = await prisma.extended.clientMeasurement.create({
        data: {
          clientName: 'Fatou BINETOU',
          clientPhone: '776665544',
          garmentType: 'Grand Boubou 3 Pièces',
          measurements: { tourPoitrine: 98, tourTaille: 85, tourHanches: 105, longueurBoubou: 145, manche: 65 },
          notes: 'Tissu Bazin Riche Violet fourni par la cliente',
        } as any,
      });

      expect(measurement.clientName).toBe('Fatou BINETOU');

      // 2. Commande de couture
      const order = await prisma.extended.tailleurOrder.create({
        data: {
          orderNumber: `CMD-${year}-0001`,
          clientName: measurement.clientName,
          clientPhone: measurement.clientPhone,
          garmentType: measurement.garmentType,
          fabricDesc: 'Bazin Riche Violet',
          totalPrice: 85000,
          advancePaid: 40000,
          measurementsId: measurement.id,
          status: 'ORDERED',
        } as any,
      });

      expect(order.orderNumber).toBe(`CMD-${year}-0001`);
      expect(order.advancePaid).toBe(40000);
      expect(order.totalPrice - order.advancePaid).toBe(45000); // Reliquat
    });
  });

  it('2. SUIVI AVANCEMENT & STATISTIQUES ATELIER : Doit suivre l avancement de la confection et les avances en XOF', async () => {
    const tenant = await prisma.withoutTenantScope(async (c) =>
      c.tenant.create({ data: { code: getRandomCode('TLR2'), name: 'Maison de Couture Dakar', sectorType: 'TAILLEUR', billingStatus: 'ACTIVE' } }),
    );
    createdTenantIds.push(tenant.id);

    await TenantContextService.runWithTenantContext(tenant.id, 'TAILLEUR', async () => {
      const year = new Date().getFullYear();

      // Commande 1 : En confection (SEWING)
      await prisma.extended.tailleurOrder.create({
        data: { orderNumber: `CMD-${year}-0001`, clientName: 'Client 1', clientPhone: '77000', garmentType: 'Costume', totalPrice: 120000, advancePaid: 60000, status: 'SEWING' } as any,
      });

      // Commande 2 : Prête & Réglée (DELIVERED)
      await prisma.extended.tailleurOrder.create({
        data: { orderNumber: `CMD-${year}-0002`, clientName: 'Client 2', clientPhone: '77000', garmentType: 'Robe', totalPrice: 50000, advancePaid: 50000, status: 'DELIVERED' } as any,
      });

      const orders = await prisma.extended.tailleurOrder.findMany();
      let inConfection = 0;
      let totalAdvances = 0;
      let totalPendingBalance = 0;

      for (const o of orders) {
        if (['ORDERED', 'CUTTING', 'SEWING', 'FITTING'].includes(o.status)) inConfection++;
        totalAdvances += o.advancePaid;
        const rem = o.totalPrice - o.advancePaid;
        if (rem > 0 && o.status !== 'DELIVERED') totalPendingBalance += rem;
      }

      expect(inConfection).toBe(1);
      expect(totalAdvances).toBe(110000);       // 60000 + 50000 = 110 000 XOF
      expect(totalPendingBalance).toBe(60000);   // Reliquat 60 000 XOF pour la commande 1
    });
  });

  it('3. RATTACHEMENT FAMILIAL & ISOLATION RECHERCHE : Exclure membres de findAll et retourner via findMembers', async () => {
    const tenant = await prisma.withoutTenantScope(async (c) =>
      c.tenant.create({ data: { code: getRandomCode('TLR3'), name: 'Atelier Couture Familial', sectorType: 'TAILLEUR', billingStatus: 'ACTIVE' } }),
    );
    createdTenantIds.push(tenant.id);

    await TenantContextService.runWithTenantContext(tenant.id, 'TAILLEUR', async () => {
      // 1. Création Fiche Tuteur (Racine)
      const tuteur = await measurementService.create({
        clientName: 'Mamadou NDIAYE',
        clientPhone: '770001122',
        garmentType: 'Boubou 3 Pièces',
        measurements: { tourPoitrine: 104, longueurBoubou: 150 },
      });

      // 2. Création Sous-Fiche Membre rattachée
      const membreMoussa = await measurementService.create({
        clientName: 'Mamadou NDIAYE',
        clientPhone: '770001122',
        beneficiaryName: 'Fils Moussa',
        garmentType: 'Ensemble Enfant',
        parentMeasurementId: tuteur.id,
        measurements: { tourPoitrine: 75, longueurBoubou: 95 },
      });

      expect(tuteur.id).toBeDefined();
      expect(membreMoussa.parentMeasurementId).toBe(tuteur.id);

      // 3. Vérification : findAll() retourne uniquement la fiche Tuteur (exclut le membre)
      const allRootSheets = await measurementService.findAll();
      expect(allRootSheets.length).toBe(1);
      expect(allRootSheets[0].id).toBe(tuteur.id);
      expect(allRootSheets[0].clientName).toBe('Mamadou NDIAYE');

      // 4. Vérification : findMembers(tuteur.id) retourne exactement le membre Fils Moussa
      const familyMembers = await measurementService.findMembers(tuteur.id);
      expect(familyMembers.length).toBe(1);
      expect(familyMembers[0].id).toBe(membreMoussa.id);
      expect(familyMembers[0].beneficiaryName).toBe('Fils Moussa');
    });
  });

  it('4. REJET RATTACHEMENT MEMBRE-DE-MEMBRE : Rejeter la hiérarchie au-delà de 2 niveaux', async () => {
    const tenant = await prisma.withoutTenantScope(async (c) =>
      c.tenant.create({ data: { code: getRandomCode('TLR4'), name: 'Atelier Couture NiveauMax', sectorType: 'TAILLEUR', billingStatus: 'ACTIVE' } }),
    );
    createdTenantIds.push(tenant.id);

    await TenantContextService.runWithTenantContext(tenant.id, 'TAILLEUR', async () => {
      // 1. Tuteur Racine
      const tuteur = await measurementService.create({
        clientName: 'Mamadou NDIAYE',
        clientPhone: '770001122',
        garmentType: 'Boubou 3 Pièces',
        measurements: {},
      });

      // 2. Membre valide (Niveau 2)
      const membreMoussa = await measurementService.create({
        clientName: 'Mamadou NDIAYE',
        clientPhone: '770001122',
        beneficiaryName: 'Fils Moussa',
        garmentType: 'Ensemble Enfant',
        parentMeasurementId: tuteur.id,
        measurements: {},
      });

      // 3. Tentative de créer un membre de membre (Niveau 3) -> Doit être rejetée avec BadRequestException 400
      await expect(
        measurementService.create({
          clientName: 'Mamadou NDIAYE',
          clientPhone: '770001122',
          beneficiaryName: 'Petit-Fils Aliou',
          garmentType: 'Tunique',
          parentMeasurementId: membreMoussa.id,
          measurements: {},
        }),
      ).rejects.toThrow(BadRequestException);

      // Vérification du nombre total de fiches en BDD : doit rester strictement à 2
      const totalCount = await prisma.extended.clientMeasurement.count();
      expect(totalCount).toBe(2);
    });
  });

  it('5. REJET FICHE PARENT INTROUVABLE : Rejeter la création avec NotFoundException si parentInexistant', async () => {
    const tenant = await prisma.withoutTenantScope(async (c) =>
      c.tenant.create({ data: { code: getRandomCode('TLR5'), name: 'Atelier ParentInexistant', sectorType: 'TAILLEUR', billingStatus: 'ACTIVE' } }),
    );
    createdTenantIds.push(tenant.id);

    await TenantContextService.runWithTenantContext(tenant.id, 'TAILLEUR', async () => {
      await expect(
        measurementService.create({
          clientName: 'Client Inexistant',
          clientPhone: '779998877',
          garmentType: 'Robe',
          parentMeasurementId: '00000000-0000-0000-0000-000000000000',
          measurements: {},
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

