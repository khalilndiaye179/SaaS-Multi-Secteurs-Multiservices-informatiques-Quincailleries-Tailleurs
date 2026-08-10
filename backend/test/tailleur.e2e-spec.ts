import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TenantContextService } from '../src/core/tenant/tenant-context.service';

describe('Module Tailleur / Couture Complété (Étape D3 Test Suite)', () => {
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
});
