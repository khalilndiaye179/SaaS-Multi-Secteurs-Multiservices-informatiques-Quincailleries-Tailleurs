import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Auth - Change Password (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

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
      await client.user.deleteMany({ where: { email: 'test-change-pw@test.com' } });
      await client.tenant.deleteMany({ where: { code: 'TEST-PW' } });

      // Create a tenant
      const tenant = await client.tenant.create({
        data: {
          name: 'Test PW',
          code: 'TEST-PW',
          sectorType: 'QUINCAILLERIE',
          billingStatus: 'ACTIVE',
        }
      });

      // Create a user who must change password
      const passwordHash = await bcrypt.hash('oldPassword123', 10);
      const user = await client.user.create({
        data: {
          tenantId: tenant.id,
          username: 'TEST-PW-01',
          fullName: 'Test User',
          email: 'test-change-pw@test.com',
          phone: '770000001',
          passwordHash,
          mustChangePassword: true,
        }
      });
      userId = user.id;
    });

    // Login to get token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        identifier: 'test-change-pw@test.com',
        password: 'oldPassword123',
      });
    
    authToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.withoutTenantScope(async (client) => {
      await client.user.deleteMany({ where: { email: 'test-change-pw@test.com' } });
      await client.tenant.deleteMany({ where: { code: 'TEST-PW' } });
    });
    await app.close();
  });

  it('should block access to other routes when mustChangePassword is true', async () => {
    // We try to access a protected route, it should be 403 Forbidden
    // Let's try to access /auth/login (wait, login is public)
    // Let's try something protected, like GET /notifications
    const res = await request(app.getHttpServer())
      .get('/notifications/tenant')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Vous devez modifier votre mot de passe (mot de passe temporaire ou réinitialisé par un administrateur).');
  });

  it('should allow changing password', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      });
    
    expect(res.status).toBe(201); // POST returns 201 by default
    expect(res.body.message).toBe('Mot de passe modifié avec succès.');

    // Check DB
    const user = await prisma.withoutTenantScope(async (client) => {
      return client.user.findUnique({ where: { id: userId } });
    });
    expect(user.mustChangePassword).toBe(false);
    
    const isValid = await bcrypt.compare('newPassword456', user.passwordHash);
    expect(isValid).toBe(true);
  });

  it('should not block access after password is changed', async () => {
    // Because the JWT payload has mustChangePassword: true, wait, if the JWT payload has it, it will still block!
    // Let's re-login with the new password
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        identifier: 'test-change-pw@test.com',
        password: 'newPassword456',
      });
    
    expect(loginRes.status).toBe(200);
    const newAuthToken = loginRes.body.accessToken;

    const res = await request(app.getHttpServer())
      .get('/notifications/tenant')
      .set('Authorization', `Bearer ${newAuthToken}`);
    
    expect(res.status).not.toBe(403); // It might be 200 or 401 if missing something else, but not 403 Must Change Password
  });
});
