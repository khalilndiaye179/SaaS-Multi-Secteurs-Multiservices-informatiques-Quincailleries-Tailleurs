import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TenantContextService } from '../src/core/tenant/tenant-context.service';
import { AiAssistantService } from '../src/modules/ai-assistant/ai-assistant.service';

describe('AI ASSISTANT SECTOR SPECIFICATION & MULTI-TENANT ISOLATION E2E TEST', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let aiService: AiAssistantService;

  const TENANT_QNC = { id: 'test-ai-qnc-tenant-id', code: 'TEST_AI_QNC', name: 'Quincaillerie Test AI', sectorType: 'QUINCAILLERIE' };
  const TENANT_ITS = { id: 'test-ai-its-tenant-id', code: 'TEST_AI_ITS', name: 'Multiservices IT Test AI', sectorType: 'MULTISERVICES_IT' };
  const TENANT_TLR = { id: 'test-ai-tlr-tenant-id', code: 'TEST_AI_TLR', name: 'Atelier Tailleur Test AI', sectorType: 'TAILLEUR' };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    aiService = app.get<AiAssistantService>(AiAssistantService);

    // Initialisation des données de test
    await prisma.withoutTenantScope(async (client) => {
      await client.stockItem.deleteMany({ where: { tenantId: { in: [TENANT_QNC.id, TENANT_ITS.id, TENANT_TLR.id] } } });
      await client.repairTicket.deleteMany({ where: { tenantId: { in: [TENANT_QNC.id, TENANT_ITS.id, TENANT_TLR.id] } } });
      await client.tailleurOrder.deleteMany({ where: { tenantId: { in: [TENANT_QNC.id, TENANT_ITS.id, TENANT_TLR.id] } } });
      await client.clientMeasurement.deleteMany({ where: { tenantId: { in: [TENANT_QNC.id, TENANT_ITS.id, TENANT_TLR.id] } } });
      await client.tenant.deleteMany({ where: { id: { in: [TENANT_QNC.id, TENANT_ITS.id, TENANT_TLR.id] } } });

      await client.tenant.createMany({
        data: [
          { id: TENANT_QNC.id, code: TENANT_QNC.code, name: TENANT_QNC.name, sectorType: TENANT_QNC.sectorType as any },
          { id: TENANT_ITS.id, code: TENANT_ITS.code, name: TENANT_ITS.name, sectorType: TENANT_ITS.sectorType as any },
          { id: TENANT_TLR.id, code: TENANT_TLR.code, name: TENANT_TLR.name, sectorType: TENANT_TLR.sectorType as any },
        ],
      });

      // Data QNC
      await client.stockItem.create({
        data: {
          tenantId: TENANT_QNC.id,
          name: 'Ciment SOCOCIM QNC',
          sku: 'CIM-QNC-01',
          unit: 'sac',
          purchasePrice: 3000,
          sellingPrice: 3800,
          quantity: 5,
          alertThreshold: 10,
        },
      });

      // Data ITS
      await client.repairTicket.create({
        data: {
          tenantId: TENANT_ITS.id,
          ticketNumber: 'IT-TICK-101',
          clientName: 'Moussa DIOP IT',
          clientPhone: '+221770000001',
          deviceModel: 'MacBook Pro M1',
          issueDesc: 'Écran cassé',
          status: 'PENDING',
          estimatedCost: 150000,
        },
      });
      await client.stockItem.create({
        data: {
          tenantId: TENANT_ITS.id,
          name: 'Écran LCD Retina IT',
          sku: 'SCR-RET-01',
          unit: 'pièce',
          purchasePrice: 80000,
          sellingPrice: 120000,
          quantity: 1,
          alertThreshold: 3,
        },
      });

      // Data TLR
      await client.tailleurOrder.create({
        data: {
          tenantId: TENANT_TLR.id,
          orderNumber: 'TLR-ORD-201',
          clientName: 'Awa SOW Tailleur',
          clientPhone: '+221770000002',
          garmentType: 'Grand Boubou Bazin',
          status: 'CUTTING',
          totalPrice: 90000,
          advancePaid: 45000,
        },
      });
      await client.clientMeasurement.create({
        data: {
          tenantId: TENANT_TLR.id,
          clientName: 'Awa SOW Tailleur',
          clientPhone: '+221770000002',
          garmentType: 'Grand Boubou',
          measurements: { tourPoitrine: 98, tourTaille: 85, longueur: 145 },
        },
      });
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.withoutTenantScope(async (client) => {
        await client.stockItem.deleteMany({ where: { tenantId: { in: [TENANT_QNC.id, TENANT_ITS.id, TENANT_TLR.id] } } });
        await client.repairTicket.deleteMany({ where: { tenantId: { in: [TENANT_QNC.id, TENANT_ITS.id, TENANT_TLR.id] } } });
        await client.tailleurOrder.deleteMany({ where: { tenantId: { in: [TENANT_QNC.id, TENANT_ITS.id, TENANT_TLR.id] } } });
        await client.clientMeasurement.deleteMany({ where: { tenantId: { in: [TENANT_QNC.id, TENANT_ITS.id, TENANT_TLR.id] } } });
        await client.tenant.deleteMany({ where: { id: { in: [TENANT_QNC.id, TENANT_ITS.id, TENANT_TLR.id] } } });
      });
      await prisma.$disconnect();
    }
    if (app) await app.close();
  });

  it('1. Le Tenant ITS-0001-01 doit recevoir un audit spécifique MULTISERVICES_IT sans données Quincaillerie', async () => {
    await TenantContextService.runWithTenantContext(TENANT_ITS.id, 'MULTISERVICES_IT', async () => {
      const audit = await aiService.performInventoryAudit();
      expect(audit.sector).toBe('MULTISERVICES_IT');
      expect(audit.sectorTitle).toContain('Multiservices IT');

      // Doit contenir le ticket IT et l'écran LCD IT
      const itemNames = audit.criticalItems.map((i: any) => i.name);
      expect(itemNames.some((n: string) => n.includes('MacBook Pro M1'))).toBe(true);
      expect(itemNames.some((n: string) => n.includes('Écran LCD Retina IT'))).toBe(true);

      // Ne doit ABSOLUMENT PAS contenir l'article de Quincaillerie du Tenant QNC
      expect(itemNames.some((n: string) => n.includes('Ciment SOCOCIM QNC'))).toBe(false);
    });
  });

  it('2. Le Tenant TLR-0001-01 doit recevoir un audit spécifique TAILLEUR sans données Quincaillerie ni IT', async () => {
    await TenantContextService.runWithTenantContext(TENANT_TLR.id, 'TAILLEUR', async () => {
      const audit = await aiService.performInventoryAudit();
      expect(audit.sector).toBe('TAILLEUR');
      expect(audit.sectorTitle).toContain('Atelier Tailleur');

      // Doit contenir la confection Tailleur
      const itemNames = audit.criticalItems.map((i: any) => i.name);
      expect(itemNames.some((n: string) => n.includes('Grand Boubou Bazin'))).toBe(true);

      // Ne doit contenir NI l'article QNC NI l'article IT
      expect(itemNames.some((n: string) => n.includes('Ciment SOCOCIM QNC'))).toBe(false);
      expect(itemNames.some((n: string) => n.includes('MacBook Pro M1'))).toBe(false);
    });
  });

  it('3. Le Tenant QNC-0001-01 doit recevoir un audit spécifique QUINCAILLERIE', async () => {
    await TenantContextService.runWithTenantContext(TENANT_QNC.id, 'QUINCAILLERIE', async () => {
      const audit = await aiService.performInventoryAudit();
      expect(audit.sector).toBe('QUINCAILLERIE');
      expect(audit.sectorTitle).toContain('Quincaillerie');

      const itemNames = audit.criticalItems.map((i: any) => i.name);
      expect(itemNames.some((n: string) => n.includes('Ciment SOCOCIM QNC'))).toBe(true);
      expect(itemNames.some((n: string) => n.includes('MacBook Pro M1'))).toBe(false);
    });
  });

  it('4. Le Chat IA doit adapter son assistance et ses modèles SMS au secteur du tenant', async () => {
    // IT Chat
    await TenantContextService.runWithTenantContext(TENANT_ITS.id, 'MULTISERVICES_IT', async () => {
      const res = await aiService.processChatPrompt({ prompt: 'générer un modèle de sms pour le client' });
      expect(res.reply).toContain('appareil');
      expect(res.reply).toContain('réparé');
    });

    // Tailleur Chat
    await TenantContextService.runWithTenantContext(TENANT_TLR.id, 'TAILLEUR', async () => {
      const res = await aiService.processChatPrompt({ prompt: 'générer un modèle de sms pour le client' });
      expect(res.reply).toContain('tenue');
      expect(res.reply).toContain('essayage');
    });
  });
});
