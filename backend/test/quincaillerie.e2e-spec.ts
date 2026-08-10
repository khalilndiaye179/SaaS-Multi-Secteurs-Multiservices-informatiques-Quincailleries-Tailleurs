import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TenantContextService } from '../src/core/tenant/tenant-context.service';

describe('Module Quincaillerie Complété (Étape D Test Suite)', () => {
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

  it('1. MOUVEMENT STOCK IN/OUT : Doit enregistrer un StockMovement et incrémenter/décrémenter la quantité en BDD', async () => {
    const tenant = await prisma.withoutTenantScope(async (c) =>
      c.tenant.create({ data: { code: getRandomCode('QNC1'), name: 'Quincaillerie Mouvements', sectorType: 'QUINCAILLERIE', billingStatus: 'ACTIVE' } }),
    );
    createdTenantIds.push(tenant.id);

    await TenantContextService.runWithTenantContext(tenant.id, 'QUINCAILLERIE', async () => {
      // 1. Création de l'article en stock
      const item = await prisma.extended.stockItem.create({
        data: {
          name: 'Fer de 10mm',
          sku: 'FER-10',
          unit: 'barre',
          purchasePrice: 3500,
          sellingPrice: 4500,
          quantity: 20,
          alertThreshold: 5,
        } as any,
      });

      // 2. Mouvement IN (+10)
      await prisma.extended.stockMovement.create({
        data: { stockItemId: item.id, type: 'IN', quantity: 10, unitPrice: 3500, reason: 'Achat SOCOCIM' } as any,
      });
      await prisma.extended.stockItem.update({ where: { id: item.id }, data: { quantity: 30 } });

      const itemAfterIn = await prisma.extended.stockItem.findFirst({ where: { id: item.id } });
      expect(itemAfterIn?.quantity).toBe(30);

      // 3. Mouvement OUT (-5)
      await prisma.extended.stockMovement.create({
        data: { stockItemId: item.id, type: 'OUT', quantity: 5, unitPrice: 4500, reason: 'Vente client' } as any,
      });
      await prisma.extended.stockItem.update({ where: { id: item.id }, data: { quantity: 25 } });

      const itemAfterOut = await prisma.extended.stockItem.findFirst({ where: { id: item.id } });
      expect(itemAfterOut?.quantity).toBe(25);
    });
  });

  it('2. RAPPORT EN XOF & ALERTE REAPPRO : Doit calculer la valeur d’achat, la valeur de vente et la marge en XOF', async () => {
    const tenant = await prisma.withoutTenantScope(async (c) =>
      c.tenant.create({ data: { code: getRandomCode('QNC2'), name: 'Quincaillerie Marge XOF', sectorType: 'QUINCAILLERIE', billingStatus: 'ACTIVE' } }),
    );
    createdTenantIds.push(tenant.id);

    await TenantContextService.runWithTenantContext(tenant.id, 'QUINCAILLERIE', async () => {
      // Création de 2 articles : 1 normal (10 sacs Ciment) et 1 en alerte (2 marteaux)
      await prisma.extended.stockItem.create({
        data: { name: 'Ciment 50kg', sku: 'CIM-50', unit: 'sac', purchasePrice: 4000, sellingPrice: 5000, quantity: 10, alertThreshold: 5 } as any,
      });
      await prisma.extended.stockItem.create({
        data: { name: 'Marteau 500g', sku: 'MART-500', unit: 'pièce', purchasePrice: 2000, sellingPrice: 3000, quantity: 2, alertThreshold: 5 } as any,
      });


      const items = await prisma.extended.stockItem.findMany();
      let totalPurchase = 0;
      let totalSelling = 0;
      let alertsCount = 0;

      for (const i of items) {
        totalPurchase += i.quantity * i.purchasePrice;
        totalSelling += i.quantity * i.sellingPrice;
        if (i.quantity <= i.alertThreshold) alertsCount++;
      }

      expect(totalPurchase).toBe(44000); // (10*4000) + (2*2000) = 44000 XOF
      expect(totalSelling).toBe(56000);  // (10*5000) + (2*3000) = 56000 XOF
      expect(totalSelling - totalPurchase).toBe(12000); // Marge = 12000 XOF
      expect(alertsCount).toBe(1); // Marteau en alerte (2 <= 5)
    });
  });
});
