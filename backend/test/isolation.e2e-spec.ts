import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ForbiddenException } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TenantContextService } from '../src/core/tenant/tenant-context.service';

describe('Isolation Multi-Tenant (FAIL-CLOSED Test Suite)', () => {
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
    if (prisma) {
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });


  it('FAIL-CLOSED : Doit lever une ForbiddenException si accès à un modèle tenant-scoped hors contexte tenant', async () => {
    // Exécution directe sans AsyncLocalStorage
    await expect(
      prisma.extended.stockItem.findMany()
    ).rejects.toThrow(ForbiddenException);
  });

  it('ISOLEMENT : Doit filtrer hermétiquement les données du Tenant A sans voir celles du Tenant B', async () => {
    const tenantAId = 'tenant-a-uuid';
    const tenantBId = 'tenant-b-uuid';

    // Test simulé dans le contexte du Tenant A
    await TenantContextService.runWithTenantContext(tenantAId, 'QUINCAILLERIE', async () => {
      const itemsA = await prisma.extended.stockItem.findMany();
      expect(itemsA.every(item => item.tenantId === tenantAId)).toBe(true);
    });

    // Test simulé dans le contexte du Tenant B
    await TenantContextService.runWithTenantContext(tenantBId, 'QUINCAILLERIE', async () => {
      const itemsB = await prisma.extended.stockItem.findMany();
      expect(itemsB.every(item => item.tenantId === tenantBId)).toBe(true);
    });
  });

  it('CONCURRENCE : 100 requêtes parallèles interfoliées ne doivent jamais leaker entre Tenant A et Tenant B', async () => {
    const tenantAId = 'tenant-a-uuid';
    const tenantBId = 'tenant-b-uuid';

    const tasks = Array.from({ length: 100 }).map((_, index) => {
      const isEven = index % 2 === 0;
      const targetTenantId = isEven ? tenantAId : tenantBId;

      return TenantContextService.runWithTenantContext(targetTenantId, 'QUINCAILLERIE', async () => {
        const items = await prisma.extended.stockItem.findMany();
        items.forEach(item => {
          expect(item.tenantId).toBe(targetTenantId);
        });
      });
    });

    await Promise.all(tasks);
  });

  it('SUPER_ADMIN BYPASS : Le SuperAdmin doit pouvoir accéder aux données en mode global via withoutTenantScope', async () => {
    const allTenants = await prisma.withoutTenantScope(async (client) => {
      return client.tenant.findMany();
    });

    expect(Array.isArray(allTenants)).toBe(true);
  });

  it('RLS POSTGRESQL DIRECT : Verification du filtrage RLS natif au niveau base de données', async () => {
    // 1. Requete brute sans definir app.current_tenant_id -> doit retourner 0 ligne en RLS
    const rowsWithoutTenant = await prisma.$queryRaw<any[]>`SELECT * FROM "stock_items";`;
    expect(rowsWithoutTenant.length).toBe(0);

    // 2. Requete brute avec SET LOCAL app.current_tenant_id -> doit retourner uniquement les lignes du tenant A
    const tenantAId = 'tenant-a-uuid';
    const rowsWithTenantA = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantAId}';`);
      return tx.$queryRaw<any[]>`SELECT * FROM "stock_items";`;
    });

    expect(rowsWithTenantA.every((r) => r.tenantId === tenantAId)).toBe(true);
  });
});

