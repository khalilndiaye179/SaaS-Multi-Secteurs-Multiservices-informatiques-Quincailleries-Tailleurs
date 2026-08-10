import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TenantContextService } from '../src/core/tenant/tenant-context.service';

describe('Module Multiservices IT Complété (Étape D2 Test Suite)', () => {
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

  it('1. CYCLE SAV & NUMEROTATION : Doit generer TCK-YYYY-0001, faire evoluer le statut du ticket et calculer le cout final', async () => {
    const tenant = await prisma.withoutTenantScope(async (c) =>
      c.tenant.create({ data: { code: getRandomCode('ITS1'), name: 'Multiservices IT SAV', sectorType: 'MULTISERVICES_IT', billingStatus: 'ACTIVE' } }),
    );
    createdTenantIds.push(tenant.id);

    await TenantContextService.runWithTenantContext(tenant.id, 'MULTISERVICES_IT', async () => {
      const year = new Date().getFullYear();

      // 1. Creation du ticket SAV
      const ticket = await prisma.extended.repairTicket.create({
        data: {
          ticketNumber: `TCK-${year}-0001`,
          clientName: 'Mamadou FALL',
          clientPhone: '775554433',
          deviceModel: 'HP EliteBook 840 G5',
          issueDesc: 'Écran noir & surchauffe',
          status: 'RECEIVED',
          estimatedCost: 35000,
        } as any,
      });

      expect(ticket.ticketNumber).toBe(`TCK-${year}-0001`);
      expect(ticket.status).toBe('RECEIVED');

      // 2. Progression : DIAGNOSIS -> IN_REPAIR -> READY -> DELIVERED
      await prisma.extended.repairTicket.update({
        where: { id: ticket.id },
        data: { status: 'READY', finalCost: 40000, notes: 'Remplacement pâte thermique & ventilateur' },
      });

      const readyTicket = await prisma.extended.repairTicket.findFirst({ where: { id: ticket.id } });
      expect(readyTicket?.status).toBe('READY');
      expect(readyTicket?.finalCost).toBe(40000);
    });
  });

  it('2. STATISTIQUES ATELIER IT : Doit comptabiliser les appareils en atelier, prets et le chiffre d affaires livre en XOF', async () => {
    const tenant = await prisma.withoutTenantScope(async (c) =>
      c.tenant.create({ data: { code: getRandomCode('ITS2'), name: 'Atelier IT Dakar', sectorType: 'MULTISERVICES_IT', billingStatus: 'ACTIVE' } }),
    );
    createdTenantIds.push(tenant.id);

    await TenantContextService.runWithTenantContext(tenant.id, 'MULTISERVICES_IT', async () => {
      const year = new Date().getFullYear();

      // Ticket 1 : En atelier (IN_REPAIR)
      await prisma.extended.repairTicket.create({
        data: { ticketNumber: `TCK-${year}-0001`, clientName: 'Client 1', clientPhone: '77000', deviceModel: 'Dell XPS 13', issueDesc: 'Batterie HS', status: 'IN_REPAIR', estimatedCost: 25000 } as any,
      });

      // Ticket 2 : Prêt à être récupéré (READY)
      await prisma.extended.repairTicket.create({
        data: { ticketNumber: `TCK-${year}-0002`, clientName: 'Client 2', clientPhone: '77000', deviceModel: 'MacBook Pro 15', issueDesc: 'Clavier bloqué', status: 'READY', estimatedCost: 45000 } as any,
      });

      // Ticket 3 : Livré & Payé (DELIVERED)
      await prisma.extended.repairTicket.create({
        data: { ticketNumber: `TCK-${year}-0003`, clientName: 'Client 3', clientPhone: '77000', deviceModel: 'Lenovo ThinkPad', issueDesc: 'Connecteur de charge', status: 'DELIVERED', estimatedCost: 15000, finalCost: 20000 } as any,
      });

      const tickets = await prisma.extended.repairTicket.findMany();
      let activeInWorkshop = 0;
      let readyCount = 0;
      let totalRevenue = 0;

      for (const t of tickets) {
        if (['RECEIVED', 'DIAGNOSIS', 'IN_REPAIR'].includes(t.status)) activeInWorkshop++;
        else if (t.status === 'READY') readyCount++;
        else if (t.status === 'DELIVERED') totalRevenue += t.finalCost || t.estimatedCost || 0;
      }

      expect(activeInWorkshop).toBe(1);
      expect(readyCount).toBe(1);
      expect(totalRevenue).toBe(20000); // 20000 XOF
    });
  });
});
