import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Super Admin RBAC Granulaire (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let supportToken: string;
  let financeToken: string;
  let techniqueToken: string;
  let superAdminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);

    await prisma.withoutTenantScope(async (client) => {
      // 1. Ensure global tenant
      let systemTenant = await client.tenant.findUnique({ where: { code: 'SAAS-GLOBAL' } });
      if (!systemTenant) {
        systemTenant = await client.tenant.create({
          data: {
            code: 'SAAS-GLOBAL',
            name: 'Global SaaS Console',
            sectorType: 'MULTISERVICES_IT',
          }
        });
      }

      // 2. Fetch or create roles
      const supportRole = await client.role.findFirst({ where: { name: 'SUPPORT', tenantId: null } });
      const financeRole = await client.role.findFirst({ where: { name: 'FINANCE', tenantId: null } });
      const techniqueRole = await client.role.findFirst({ where: { name: 'TECHNIQUE', tenantId: null } });
      const saRole = await client.role.findFirst({ where: { name: 'SUPER_ADMIN', tenantId: null } });

      if (!supportRole || !financeRole || !techniqueRole || !saRole) {
        throw new Error('Les rôles système doivent être seedés avant le test');
      }

      const passwordHash = await bcrypt.hash('password123', 10);

      // Helper to create test user
      const createTestUser = async (email: string, roleId: string) => {
        let user = await client.user.findFirst({ where: { email } });
        if (!user) {
          user = await client.user.create({
            data: {
              email,
              phone: `+22177000${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
              username: email.split('@')[0],
              fullName: `Test ${email}`,
              passwordHash,
              tenant: { connect: { id: systemTenant!.id } },
              isActive: true,
              userRoles: {
                create: { roleId }
              }
            }
          });
        }
        return user;
      };

      await createTestUser('test-support@saas.com', supportRole.id);
      await createTestUser('test-finance@saas.com', financeRole.id);
      await createTestUser('test-technique@saas.com', techniqueRole.id);
      await createTestUser('test-sa@saas.com', saRole.id);
    });

    // Login to get tokens
    const getLoginToken = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier: email, password: 'password123' })
        .expect(200);
      return res.body.accessToken;
    };

    supportToken = await getLoginToken('test-support@saas.com');
    financeToken = await getLoginToken('test-finance@saas.com');
    techniqueToken = await getLoginToken('test-technique@saas.com');
    superAdminToken = await getLoginToken('test-sa@saas.com');
  });

  afterAll(async () => {
    // Cleanup created users
    const emails = ['test-support@saas.com', 'test-finance@saas.com', 'test-technique@saas.com', 'test-sa@saas.com'];
    await prisma.withoutTenantScope(async (client) => {
      await client.user.deleteMany({ where: { email: { in: emails } } });
    });
    await app.close();
  });

  describe('Rôle: SUPPORT', () => {
    it('Peut lire les tenants', async () => {
      const res = await request(app.getHttpServer())
        .get('/super-admin/tenants')
        .set('Authorization', `Bearer ${supportToken}`);
      expect(res.status).toBe(200);
    });

    it('Ne peut PAS accéder au dashboard billing', async () => {
      await request(app.getHttpServer())
        .get('/super-admin/billing/overview')
        .set('Authorization', `Bearer ${supportToken}`)
        .expect(403);
    });

    it('Ne peut PAS accéder au security-center', async () => {
      await request(app.getHttpServer())
        .get('/super-admin/security/overview')
        .set('Authorization', `Bearer ${supportToken}`)
        .expect(403);
    });
  });

  describe('Rôle: FINANCE', () => {
    it('Peut accéder au dashboard billing', async () => {
      await request(app.getHttpServer())
        .get('/super-admin/billing/overview')
        .set('Authorization', `Bearer ${financeToken}`)
        .expect(200);
    });

    it('Ne peut PAS accéder au security-center', async () => {
      await request(app.getHttpServer())
        .get('/super-admin/security/overview')
        .set('Authorization', `Bearer ${financeToken}`)
        .expect(403);
    });

    it('Ne peut PAS gérer l\'équipe système', async () => {
      await request(app.getHttpServer())
        .get('/super-admin/team')
        .set('Authorization', `Bearer ${financeToken}`)
        .expect(403);
    });
  });

  describe('Rôle: TECHNIQUE', () => {
    it('Peut accéder au security-center', async () => {
      await request(app.getHttpServer())
        .get('/super-admin/security/overview')
        .set('Authorization', `Bearer ${techniqueToken}`)
        .expect(200);
    });

    it('Ne peut PAS accéder au dashboard billing', async () => {
      await request(app.getHttpServer())
        .get('/super-admin/billing/overview')
        .set('Authorization', `Bearer ${techniqueToken}`)
        .expect(403);
    });

    it('Ne peut PAS gérer l\'équipe système', async () => {
      await request(app.getHttpServer())
        .post('/super-admin/team/collaborators')
        .set('Authorization', `Bearer ${techniqueToken}`)
        .send({ email: 'fake@fake.com', roleName: 'SUPPORT' })
        .expect(403);
    });
  });

  describe('Rôle: SUPER_ADMIN', () => {
    it('Peut accéder à tout (Billing, Security, Team)', async () => {
      await request(app.getHttpServer())
        .get('/super-admin/billing/overview')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/super-admin/security/overview')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
    });
  });

  describe('Routes partagées', () => {
    it('Tous les rôles peuvent accéder à la route About', async () => {
      await request(app.getHttpServer())
        .get('/super-admin/about')
        .set('Authorization', `Bearer ${supportToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/super-admin/about')
        .set('Authorization', `Bearer ${financeToken}`)
        .expect(200);
    });
  });

  describe('Actions Destructrices (Restreintes au SUPER_ADMIN exclusif)', () => {
    it('TECHNIQUE ne peut pas update un tenant', async () => {
      await request(app.getHttpServer())
        .put('/super-admin/tenants/fake-id')
        .set('Authorization', `Bearer ${techniqueToken}`)
        .send({ name: 'Update' })
        .expect(403);
    });

    it('SUPPORT ne peut pas purger les tenants de démo', async () => {
      await request(app.getHttpServer())
        .post('/super-admin/tenants/purge-test')
        .set('Authorization', `Bearer ${supportToken}`)
        .expect(403);
    });
  });
});
