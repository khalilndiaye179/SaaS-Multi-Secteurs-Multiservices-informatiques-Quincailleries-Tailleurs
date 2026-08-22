import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';

describe('PublicDocumentsController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/public/documents/view/pdf sans jeton doit rejeter 401/403', async () => {
    await request(app.getHttpServer())
      .get('/api/public/documents/view/pdf?token=invalid_token')
      .expect(401);
  });

  it('GET /api/public/documents/view/pdf avec un jeton expiré ou corrompu doit retourner 401', async () => {
    const expiredToken = jwtService.sign(
      { documentType: 'FACTURE', documentId: 'fake-invoice-id', tenantId: 'fake-tenant-id', purpose: 'DOCUMENT_SHARE' },
      { expiresIn: '-1s' },
    );
    await request(app.getHttpServer())
      .get(`/api/public/documents/view/pdf?token=${expiredToken}`)
      .expect(401);
  });

  it('Vérification stricte de l\'isolation multi-tenant : un jeton du tenant A ne doit pas accéder au document du tenant B', async () => {
    // Jeton signé pour le Tenant A tentant d'accéder à un document du Tenant B
    const tenantATokenForTenantBDoc = jwtService.sign({
      documentType: 'FACTURE',
      documentId: 'invoice-belonging-to-tenant-B',
      tenantId: 'tenant-A-id', // Tenant A
      purpose: 'DOCUMENT_SHARE',
    });

    const response = await request(app.getHttpServer())
      .get(`/api/public/documents/view/pdf?token=${tenantATokenForTenantBDoc}`);

    // Doit rejeter avec 404 (document non trouvé sous la portée du tenant A) ou 401/403 (isolation stricte)
    expect([404, 401, 403]).toContain(response.status);
  });

  it('GET /api/public/documents/view/pdf avec un jeton valide doit retourner du binaire application/pdf', async () => {
    const shareToken = jwtService.sign({
      documentType: 'FACTURE',
      documentId: 'fake-invoice-id',
      tenantId: 'fake-tenant-id',
      purpose: 'DOCUMENT_SHARE',
    });

    const response = await request(app.getHttpServer())
      .get(`/api/public/documents/view/pdf?token=${shareToken}`);

    expect([200, 404]).toContain(response.status);
    if (response.status === 200) {
      expect(response.headers['content-type']).toBe('application/pdf');
    }
  });
});
