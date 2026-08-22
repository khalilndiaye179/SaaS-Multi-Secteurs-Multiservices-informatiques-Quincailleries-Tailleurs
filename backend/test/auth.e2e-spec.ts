import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { EmailOtpService } from '../src/modules/notifications/email-otp.service';

describe('AuthController (e2e) - Inscription & OTP', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let emailOtpService: EmailOtpService;

  const testEmail = 'test-otp@saasuemoa.com';
  const testPhone = '771234567'; // Format valide
  const badPhone = '12345'; // Format invalide

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
    emailOtpService = app.get(EmailOtpService);

    // Nettoyage avant tests
    await prisma.withoutTenantScope(async (tx) => {
      await tx.user.deleteMany({ where: { email: testEmail } });
      await tx.tenant.deleteMany({ where: { email: testEmail } });
    });
  });

  afterAll(async () => {
    await prisma.withoutTenantScope(async (tx) => {
      await tx.user.deleteMany({ where: { email: testEmail } });
      await tx.tenant.deleteMany({ where: { email: testEmail } });
    });
    await app.close();
  });

  describe('/auth/register/init (POST)', () => {
    it('doit rejeter un téléphone au mauvais format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register/init')
        .send({
          sectorType: 'QUINCAILLERIE',
          companyName: 'Test OTP',
          managerName: 'Manager Test',
          email: testEmail,
          phone: badPhone,
          country: 'SN',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Numéro de téléphone invalide, format attendu : 77XXXXXXX ou +221XXXXXXXXX');
    });

    it('doit accepter un format valide et générer un OTP', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register/init')
        .send({
          sectorType: 'QUINCAILLERIE',
          companyName: 'Test OTP',
          managerName: 'Manager Test',
          email: testEmail,
          phone: testPhone,
          country: 'SN',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toEqual('Un code de vérification a été envoyé à votre adresse email.');
    });

    it('doit rejeter un email déjà utilisé (ou en attente)', async () => {
      // Pour l'instant on teste juste si le anti-flood fonctionne car on vient d'envoyer
      const response = await request(app.getHttpServer())
        .post('/auth/register/init')
        .send({
          sectorType: 'QUINCAILLERIE',
          companyName: 'Test OTP',
          managerName: 'Manager Test',
          email: testEmail,
          phone: testPhone,
          country: 'SN',
          password: 'password123',
        });

      expect(response.status).toBe(429); // TOO_MANY_REQUESTS
    });
  });

  describe('/auth/register/confirm (POST)', () => {
    it('doit rejeter sans email/otp', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register/confirm')
        .send({});
      expect(response.status).toBe(400);
    });

    it('doit rejeter avec un faux OTP', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register/confirm')
        .send({
          email: testEmail,
          otp: '000000',
        });
      expect(response.status).toBe(400);
      expect(response.body.message).toEqual('Code incorrect.');
    });

    it('doit valider l\'inscription avec le bon OTP', async () => {
      // On va tricher en accédant au cache de emailOtpService
      const cacheMap = (emailOtpService as any).otpCache as Map<string, any>;
      const record = cacheMap.get(testEmail);
      expect(record).toBeDefined();

      // On simule qu'on connait le hash (en test unitaire c'est dur de récupérer le raw OTP)
      // En e2e, on pourrait mocker le service Email. Ici on contourne pour le test.
      
      // On injecte un faux hash pour un code "123456"
      const hash123456 = (emailOtpService as any).hashOtp('123456');
      record.hashedOtp = hash123456;
      cacheMap.set(testEmail, record);

      const response = await request(app.getHttpServer())
        .post('/auth/register/confirm')
        .send({
          email: testEmail,
          otp: '123456',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toHaveProperty('emailVerified', true);

      // Vérifier en base
      const user = await prisma.withoutTenantScope(async (tx) => {
        return tx.user.findFirst({ where: { email: testEmail } });
      });
      expect(user).toBeDefined();
      expect(user?.emailVerified).toBe(true);
    });

    it('doit rejeter une inscription si aucune initialisation préalable (cache vide)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register/confirm')
        .send({
          email: 'not-in-cache@saasuemoa.com',
          otp: '123456',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toEqual('Code invalide ou expiré.');
    });
  });
});
