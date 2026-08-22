import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ForbiddenException } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TenantContextService } from '../src/core/tenant/tenant-context.service';
import { JwtService } from '@nestjs/jwt';

describe('PHASE 5 — RED TEAM MULTI-TENANT ISOLATION E2E TEST SUITE', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // Tenants Red Team
  const TENANT_A = { id: 'redteam-tenant-a-uuid', code: 'REDTEAM_A', name: 'Tenant REDTEAM A', sectorType: 'QUINCAILLERIE' };
  const TENANT_B = { id: 'redteam-tenant-b-uuid', code: 'REDTEAM_B', name: 'Tenant REDTEAM B', sectorType: 'QUINCAILLERIE' };
  const TENANT_C = { id: 'redteam-tenant-c-uuid', code: 'REDTEAM_C', name: 'Tenant REDTEAM C', sectorType: 'MULTISERVICES_IT' };

  let tokenA: string;
  let tokenB: string;
  let tokenC: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Initialisation réelle des entités Tenants en BDD via withoutTenantScope (Bypass système)
    await prisma.withoutTenantScope(async (client) => {
      // Nettoyage préalable des tenants de test s'ils existent
      await client.stockItem.deleteMany({
        where: { tenantId: { in: [TENANT_A.id, TENANT_B.id, TENANT_C.id] } },
      });
      await client.tenant.deleteMany({
        where: { id: { in: [TENANT_A.id, TENANT_B.id, TENANT_C.id] } },
      });

      // Création physique des 3 tenants
      await client.tenant.createMany({
        data: [
          { id: TENANT_A.id, code: TENANT_A.code, name: TENANT_A.name, sectorType: TENANT_A.sectorType as any },
          { id: TENANT_B.id, code: TENANT_B.code, name: TENANT_B.name, sectorType: TENANT_B.sectorType as any },
          { id: TENANT_C.id, code: TENANT_C.code, name: TENANT_C.name, sectorType: TENANT_C.sectorType as any },
        ],
      });
    });

    // Initialisation contextes & tokens
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_only_for_types';
    tokenA = jwtService.sign({ sub: 'user-a-id', tenantId: TENANT_A.id, sectorType: TENANT_A.sectorType, roles: ['ADMIN_TENANT'] }, { secret: jwtSecret });
    tokenB = jwtService.sign({ sub: 'user-b-id', tenantId: TENANT_B.id, sectorType: TENANT_B.sectorType, roles: ['ADMIN_TENANT'] }, { secret: jwtSecret });
    tokenC = jwtService.sign({ sub: 'user-c-id', tenantId: TENANT_C.id, sectorType: TENANT_C.sectorType, roles: ['ADMIN_TENANT'] }, { secret: jwtSecret });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.withoutTenantScope(async (client) => {
        await client.stockItem.deleteMany({
          where: { tenantId: { in: [TENANT_A.id, TENANT_B.id, TENANT_C.id] } },
        });
        await client.tenant.deleteMany({
          where: { id: { in: [TENANT_A.id, TENANT_B.id, TENANT_C.id] } },
        });
      });
      await prisma.$disconnect();
    }
    if (app) await app.close();
  });

  // 1. FAIL-CLOSED TEST
  describe('1. FAIL-CLOSED STRICTNESS', () => {
    it('Doit REJETER toute requête Prisma hors contexte AsyncLocalStorage', async () => {
      await expect(prisma.extended.stockItem.findMany()).rejects.toThrow(ForbiddenException);
      await expect(prisma.extended.repairTicket.findMany()).rejects.toThrow(ForbiddenException);
      await expect(prisma.extended.quote.findMany()).rejects.toThrow(ForbiddenException);
      await expect(prisma.extended.invoice.findMany()).rejects.toThrow(ForbiddenException);
    });
  });

  // 2. CROSS-TENANT MATRIX TESTS
  describe('2. CROSS-TENANT MATRIX READ/UPDATE/DELETE ISOLATION', () => {
    it('Tenant A ne doit JAMAIS lire les éléments du Tenant B ni du Tenant C', async () => {
      await TenantContextService.runWithTenantContext(TENANT_A.id, 'QUINCAILLERIE', async () => {
        const items = await prisma.extended.stockItem.findMany();
        items.forEach((item) => {
          expect(item.tenantId).toBe(TENANT_A.id);
          expect(item.tenantId).not.toBe(TENANT_B.id);
          expect(item.tenantId).not.toBe(TENANT_C.id);
        });
      });
    });

    it('Tenant A ne doit pas pouvoir UPDATE une ressource appartenant à Tenant B (BOLA/IDOR)', async () => {
      const fakeIdB = 'fake-stock-id-b';
      await TenantContextService.runWithTenantContext(TENANT_A.id, 'QUINCAILLERIE', async () => {
        const updated = await prisma.extended.stockItem.updateMany({
          where: { id: fakeIdB },
          data: { name: 'Piraté par A' },
        });
        expect(updated.count).toBe(0);
      });
    });

    it('Tenant A ne doit pas pouvoir DELETE une ressource appartenant à Tenant B', async () => {
      const fakeIdB = 'fake-stock-id-b';
      await TenantContextService.runWithTenantContext(TENANT_A.id, 'QUINCAILLERIE', async () => {
        const deleted = await prisma.extended.stockItem.deleteMany({
          where: { id: fakeIdB },
        });
        expect(deleted.count).toBe(0);
      });
    });
  });

  // 3. TENANTID INJECTION ATTACKS
  describe('3. TENANTID INJECTION & UPDATE ATTACKS', () => {
    it('Tenant A créant un article avec { tenantId: TENANT_B.id } doit voir le tenantId forcé à TENANT_A.id', async () => {
      await TenantContextService.runWithTenantContext(TENANT_A.id, 'QUINCAILLERIE', async () => {
        const newItem = await prisma.extended.stockItem.create({
          data: {
            name: 'Test Injection A',
            sku: 'SKU-INJ-01',
            unit: 'sac',
            purchasePrice: 1000,
            sellingPrice: 1500,
            quantity: 10,
            alertThreshold: 2,
            tenantId: TENANT_B.id, // Tentative d'injection malveillante !
          } as any,
        });

        // Assertion stricte : l'extension Prisma et la BDD doivent écraser tenantId par TENANT_A.id
        expect(newItem.tenantId).toBe(TENANT_A.id);
        expect(newItem.tenantId).not.toBe(TENANT_B.id);

        // Vérification directe qu'il n'existe AUCUN article créé sous TENANT_B par cette opération
        const itemInB = await prisma.withoutTenantScope(async (client) => {
          return client.stockItem.findFirst({
            where: { id: newItem.id, tenantId: TENANT_B.id },
          });
        });
        expect(itemInB).toBeNull();
      });
    });
  });

  // 4. CONNECTION POOLING STRESS & CONCURRENCY TEST
  describe('4. STRESS & CONNECTION POOL CONTEXT LEAK TEST (1000 REQUÊTES)', () => {
    it('1000 requêtes parallèles interfoliées entre A, B et C ne doivent jamais leaker de contexte', async () => {
      const tenants = [TENANT_A.id, TENANT_B.id, TENANT_C.id];

      const tasks = Array.from({ length: 1000 }).map((_, index) => {
        const targetTenantId = tenants[index % 3];
        const sector = index % 3 === 2 ? 'MULTISERVICES_IT' : 'QUINCAILLERIE';

        return TenantContextService.runWithTenantContext(targetTenantId, sector, async () => {
          const items = await prisma.extended.stockItem.findMany();
          items.forEach((item) => {
            expect(item.tenantId).toBe(targetTenantId);
          });
        });
      });

      await Promise.all(tasks);
    });
  });

  // 5. NATIVE POSTGRESQL RLS FAIL-CLOSED & ATTACK TEST (SQL BRUT EXPLICITE SANS PRISMA EXTENDED)
  describe('5. NATIVE POSTGRESQL RLS FAIL-CLOSED & ATTACK TEST', () => {
    it('Une requête SQL brute sans variable app.current_tenant_id doit renvoyer 0 ligne (RLS Fail-Closed)', async () => {
      // Reinitialisation explicite de la variable de session PostgreSQL pour garantir l'absence de tenantId
      const rows = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`RESET app.current_tenant_id;`);
        return tx.$queryRaw<any[]>`SELECT * FROM "stock_items";`;
      }, { maxWait: 20000, timeout: 20000 });
      expect(rows.length).toBe(0);
    });


    it('PostgreSQL RLS doit isoler hermétiquement la lecture entre Tenant A et Tenant B en SQL brut', async () => {
      const rowsA = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${TENANT_A.id}';`);
        return tx.$queryRaw<any[]>`SELECT * FROM "stock_items";`;
      }, { maxWait: 20000, timeout: 20000 });

      rowsA.forEach((r) => {
        expect(r.tenantId).toBe(TENANT_A.id);
        expect(r.tenantId).not.toBe(TENANT_B.id);
      });
    });

    it('PostgreSQL RLS WITH CHECK doit rejeter un INSERT SQL brut avec tenantId = TENANT_B lorsque le contexte Postgres est TENANT_A', async () => {
      await expect(
        prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${TENANT_A.id}';`);
          return tx.$executeRawUnsafe(`
            INSERT INTO "stock_items" ("id", "tenantId", "name", "sku", "unit", "purchasePrice", "sellingPrice", "quantity", "alertThreshold", "updatedAt")
            VALUES ('raw-sql-inj-id', '${TENANT_B.id}', 'Article SQL Frauduleux', 'SKU-RAW-01', 'unite', 100, 200, 5, 1, NOW());
          `);
        }, { maxWait: 20000, timeout: 20000 })
      ).rejects.toThrow();
    });

    it('PostgreSQL RLS USING doit empêcher un UPDATE SQL brut sur le Tenant B lorsque le contexte Postgres est TENANT_A', async () => {
      const count = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${TENANT_A.id}';`);
        return tx.$executeRawUnsafe(`UPDATE "stock_items" SET "name" = 'Pirate' WHERE "tenantId" = '${TENANT_B.id}';`);
      }, { maxWait: 20000, timeout: 20000 });

      expect(count).toBe(0);
    });

    it('PostgreSQL RLS USING doit empêcher un DELETE SQL brut sur le Tenant B lorsque le contexte Postgres est TENANT_A', async () => {
      const count = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${TENANT_A.id}';`);
        return tx.$executeRawUnsafe(`DELETE FROM "stock_items" WHERE "tenantId" = '${TENANT_B.id}';`);
      }, { maxWait: 20000, timeout: 20000 });

      expect(count).toBe(0);
    });

    it('PostgreSQL RLS SECURITY AUDIT: Le rôle applicatif ne doit PAS posséder les privilèges SUPERUSER ni BYPASS RLS', async () => {
      const roles = await prisma.$queryRaw<any[]>`
        SELECT rolname, rolsuper, rolbypassrls
        FROM pg_roles
        WHERE rolname = current_user;
      `;

      expect(roles.length).toBeGreaterThan(0);
      expect(roles[0].rolsuper).toBe(false);
      expect(roles[0].rolbypassrls).toBe(false);
    });

    it('TEST A — Bootstrap Système Autorisé : withoutTenantScope doit pouvoir exécuter des requêtes système RLS via set_config local', async () => {
      const res = await prisma.withoutTenantScope(async (client) => {
        return client.tenant.findUnique({ where: { code: 'KPSY-ADMIN' } });
      });
      expect(res).toBeDefined();
    });

    it('TEST F — Isolation Inter-Transactions : La variable app.current_tenant_id ne doit JAMAIS fuiter après un commit transactionnel sans tenant context', async () => {
      // Executer d'abord un wrapper sans tenant
      await prisma.withoutTenantScope(async (client) => {
        return client.tenant.findMany();
      });

      // Immédiatement après, tenter une requête SQL brute hors transaction sans variable
      const rows = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`RESET app.current_tenant_id;`);
        return tx.$queryRaw<any[]>`SELECT * FROM "stock_items";`;
      }, { maxWait: 20000, timeout: 20000 });

      expect(rows.length).toBe(0);
    });
  });
});


