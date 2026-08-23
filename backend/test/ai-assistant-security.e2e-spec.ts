import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AiAssistantController Security (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let normalTenantId: string;
  let normalAccessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    // 1. Créer un tenant normal pour le test
    const tenant = await prisma.withoutTenantScope(async (tx) => {
      return tx.tenant.create({
        data: {
          code: 'SEC-TEST-001',
          name: 'Security Test Tenant',
          sectorType: 'QUINCAILLERIE',
          billingStatus: 'ACTIVE',
        },
      });
    });
    normalTenantId = tenant.id;

    // 2. Générer un token valide pour ce tenant
    normalAccessToken = jwtService.sign({
      sub: 'fake-user-id',
      tenantId: normalTenantId,
      sectorType: 'QUINCAILLERIE',
      roles: ['ADMIN_TENANT'],
      tenantCode: 'SEC-TEST-001',
    });
  });

  afterAll(async () => {
    await prisma.withoutTenantScope(async (tx) => {
      await tx.tenant.delete({ where: { id: normalTenantId } });
    });
    await app.close();
  });

  describe('Prévention d\'escalade de privilèges via sectorType', () => {
    it('doit renvoyer 403 Forbidden sur la route /ai-assistant/super-admin/inventory-audit avec un token normal', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai-assistant/super-admin/inventory-audit')
        .set('Authorization', `Bearer ${normalAccessToken}`)
        .send({});

      // L'accès doit être refusé car le JWT ne contient pas le rôle SUPER_ADMIN
      expect(response.status).toBe(403);
    });

    it('doit ignorer le sectorType: "SUPER_ADMIN" injecté dans le payload de la route publique /ai-assistant/inventory-audit', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai-assistant/inventory-audit')
        .set('Authorization', `Bearer ${normalAccessToken}`)
        .send({
          sectorType: 'SUPER_ADMIN', // Tentative d'escalade
        });

      // La requête doit passer mais ignorer le SUPER_ADMIN du body,
      // et traiter le tenant comme une QUINCAILLERIE (ou selon son JWT).
      // On s'attend à recevoir des données avec sectorTitle de Quincaillerie, pas le dashboard SuperAdmin.
      expect(response.status).toBe(201); // Ou 200 selon votre paramétrage NestJS pour @Post
      expect(response.body).toHaveProperty('sectorTitle');
      expect(response.body.sectorTitle).toContain('Quincaillerie');
      expect(response.body.sectorTitle).not.toContain('Supervision SaaS Super-Admin');
    });
  });
});
