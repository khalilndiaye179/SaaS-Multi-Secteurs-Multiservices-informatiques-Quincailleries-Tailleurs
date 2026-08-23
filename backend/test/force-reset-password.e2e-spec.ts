import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Auth - Force Reset Password (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let superAdminToken: string;
  let targetUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    
    // Clean up
    await prisma.withoutTenantScope(async (client) => {
      await client.user.deleteMany({ where: { email: { in: ['superadmin-reset@test.com', 'target-reset@test.com'] } } });

      // Ensure SAAS-GLOBAL exists
      let globalTenant = await client.tenant.findUnique({ where: { code: 'SAAS-GLOBAL' } });
      if (!globalTenant) {
          globalTenant = await client.tenant.create({
              data: {
                  name: 'SaaS Global Console',
                  code: 'SAAS-GLOBAL',
                  sectorType: 'MULTISERVICES_IT',
                  billingStatus: 'ACTIVE',
                  isPermanentDemo: true,
                  isDemo: true,
              }
          });
      }

      // Create a Super Admin
      const superAdminRole = await client.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
      const superAdmin = await client.user.create({
        data: {
          tenantId: globalTenant.id,
          username: 'SA-RESET-01',
          fullName: 'Super Admin',
          email: 'superadmin-reset@test.com',
          phone: '770000002',
          passwordHash: await bcrypt.hash('password123', 10),
          userRoles: {
              create: { roleId: superAdminRole!.id }
          }
        }
      });

      // Create a Target User
      const targetUser = await client.user.create({
        data: {
          tenantId: globalTenant.id,
          username: 'TARGET-RESET-01',
          fullName: 'Target User',
          email: 'target-reset@test.com',
          phone: '770000003',
          passwordHash: await bcrypt.hash('oldTargetPassword', 10),
          mustChangePassword: false,
        }
      });
      targetUserId = targetUser.id;
    });

    // Login Super Admin
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        identifier: 'superadmin-reset@test.com',
        password: 'password123',
      });
    
    superAdminToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.withoutTenantScope(async (client) => {
      await client.user.deleteMany({ where: { email: { in: ['superadmin-reset@test.com', 'target-reset@test.com'] } } });
    });
    await app.close();
  });

  it('should reset password by super admin', async () => {
    const res = await request(app.getHttpServer())
      .post(`/super-admin/team/${targetUserId}/reset-password`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.newPassword).toBeDefined();

    // Check DB
    const user = await prisma.withoutTenantScope(async (client) => {
      return client.user.findUnique({ where: { id: targetUserId } });
    });
    expect(user.mustChangePassword).toBe(true); // Flag is set!
    
    const isValidOld = await bcrypt.compare('oldTargetPassword', user.passwordHash);
    expect(isValidOld).toBe(false);

    const isValidNew = await bcrypt.compare(res.body.newPassword, user.passwordHash);
    expect(isValidNew).toBe(true);
  });
});
