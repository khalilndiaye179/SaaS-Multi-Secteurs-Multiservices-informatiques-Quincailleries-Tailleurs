import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('NotificationsController Security (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let tenant1Id: string;
  let tenant2Id: string;
  let tenant1Token: string;
  let notifTenant2Id: string;

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

    // 1. Créer deux tenants pour tester le cross-tenant
    const tenant1 = await prisma.withoutTenantScope(async (tx) => {
      return tx.tenant.create({
        data: {
          code: 'SEC-NOTIF-001',
          name: 'Security Notif Tenant 1',
          sectorType: 'QUINCAILLERIE',
          billingStatus: 'ACTIVE',
        },
      });
    });
    tenant1Id = tenant1.id;

    const tenant2 = await prisma.withoutTenantScope(async (tx) => {
      return tx.tenant.create({
        data: {
          code: 'SEC-NOTIF-002',
          name: 'Security Notif Tenant 2',
          sectorType: 'QUINCAILLERIE',
          billingStatus: 'ACTIVE',
        },
      });
    });
    tenant2Id = tenant2.id;

    // 2. Générer un token valide pour le tenant 1
    tenant1Token = jwtService.sign({
      sub: 'fake-user-id',
      tenantId: tenant1Id,
      sectorType: 'QUINCAILLERIE',
      roles: ['ADMIN_TENANT'],
      tenantCode: 'SEC-NOTIF-001',
    });

    // 3. Créer une notification appartenant au tenant 2
    const notif = await prisma.withoutTenantScope(async (tx) => {
      return tx.notification.create({
        data: {
          tenantId: tenant2Id,
          type: 'SYSTEM',
          title: 'Test Notif',
          message: 'Message pour tenant 2',
          isRead: false,
        },
      });
    });
    notifTenant2Id = notif.id;
  });

  afterAll(async () => {
    await prisma.withoutTenantScope(async (tx) => {
      await tx.notification.deleteMany({
        where: { tenantId: { in: [tenant1Id, tenant2Id] } },
      });
      await tx.tenant.deleteMany({
        where: { id: { in: [tenant1Id, tenant2Id] } },
      });
    });
    await app.close();
  });

  describe('Protection des routes globales (Super Admin)', () => {
    it('doit renvoyer 403 Forbidden sur /notifications/super-admin pour un tenant normal', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications/super-admin')
        .set('Authorization', `Bearer ${tenant1Token}`);

      expect(response.status).toBe(403);
    });

    it('doit renvoyer 403 Forbidden sur /notifications/super-admin/unread-count pour un tenant normal', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications/super-admin/unread-count')
        .set('Authorization', `Bearer ${tenant1Token}`);

      expect(response.status).toBe(403);
    });
    
    it('doit renvoyer 403 Forbidden sur /notifications/super-admin/read-all pour un tenant normal', async () => {
      const response = await request(app.getHttpServer())
        .post('/notifications/super-admin/read-all')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send();

      expect(response.status).toBe(403);
    });
  });

  describe('Prévention IDOR (Cross-Tenant)', () => {
    it('ne doit pas marquer comme lue une notification appartenant à un autre tenant (doit renvoyer 404)', async () => {
      // Le tenant 1 essaie de lire la notif du tenant 2
      const response = await request(app.getHttpServer())
        .post(`/notifications/${notifTenant2Id}/read`)
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send();

      // On s'attend à une erreur 404 (NotFoundException) car la requête est strictement filtrée sur tenantId
      expect(response.status).toBe(404);

      // Vérifier en base que la notification est toujours non lue
      const notifInDb = await prisma.withoutTenantScope(async (tx) => {
        return tx.notification.findUnique({
          where: { id: notifTenant2Id },
        });
      });

      expect(notifInDb).toBeDefined();
      expect(notifInDb?.isRead).toBe(false); // Doit rester false
    });
  });
});
