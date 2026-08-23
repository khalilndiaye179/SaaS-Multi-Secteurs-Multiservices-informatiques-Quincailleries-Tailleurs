import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('SaaSQuoteController Security (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let tenantAId: string;
  let tenantBId: string;
  let tenantBToken: string;
  let quoteTenantAId: string;

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

    // 1. Créer deux tenants pour tester l'IDOR
    const tenantA = await prisma.withoutTenantScope(async (tx) => {
      return tx.tenant.create({
        data: {
          code: 'SEC-QUOTE-001',
          name: 'Security Quote Tenant A',
          sectorType: 'QUINCAILLERIE',
          billingStatus: 'ACTIVE',
        },
      });
    });
    tenantAId = tenantA.id;

    const tenantB = await prisma.withoutTenantScope(async (tx) => {
      return tx.tenant.create({
        data: {
          code: 'SEC-QUOTE-002',
          name: 'Security Quote Tenant B',
          sectorType: 'QUINCAILLERIE',
          billingStatus: 'ACTIVE',
        },
      });
    });
    tenantBId = tenantB.id;

    // 2. Générer un token valide pour le tenant B
    tenantBToken = jwtService.sign({
      sub: 'fake-user-id',
      tenantId: tenantBId,
      sectorType: 'QUINCAILLERIE',
      roles: ['ADMIN_TENANT'],
      tenantCode: 'SEC-QUOTE-002',
    });

    // 3. Créer un devis appartenant au tenant A
    const quote = await prisma.withoutTenantScope(async (tx) => {
      return tx.saaSQuote.create({
        data: {
          tenantId: tenantAId,
          quoteNumber: 'DEV-SEC-001',
          clientName: 'Client A',
          clientEmail: 'client-a@test-security.com',
          planName: 'STARTER',
          durationMonths: 12,
          subtotal: 10000,
          discount: 0,
          tax: 1800,
          total: 11800,
          currency: 'XOF',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    });
    quoteTenantAId = quote.id;
  });

  afterAll(async () => {
    await prisma.withoutTenantScope(async (tx) => {
      await tx.saaSQuote.deleteMany({
        where: { tenantId: { in: [tenantAId, tenantBId] } },
      });
      await tx.tenant.deleteMany({
        where: { id: { in: [tenantAId, tenantBId] } },
      });
    });
    await app.close();
  });

  describe('Prévention IDOR sur le téléchargement PDF de devis', () => {
    it('doit renvoyer 403 Forbidden lorsqu\'un tenant tente de télécharger le PDF d\'un devis d\'un autre tenant', async () => {
      // Le tenant B tente de télécharger le devis PDF du tenant A
      const response = await request(app.getHttpServer())
        .get(`/super-admin/saas-quotes/${quoteTenantAId}/pdf`)
        .set('Authorization', `Bearer ${tenantBToken}`);

      // L'appel interne à findOne() doit lever une ForbiddenException (403)
      expect(response.status).toBe(403);
      // Le body doit contenir un message d'erreur et ne doit pas être un buffer PDF
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Accès refusé');
    });
  });
});
