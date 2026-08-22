import { Test, TestingModule } from '@nestjs/testing';
import { PaymentProviderRegistry } from './payment-provider.registry';
import { PaymentProviderService } from './payment-provider.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../core/security/encryption.service';
import { AuditLogService } from '../super-admin/audit-log.service';

describe('PaymentProviderModule (Unit Tests & Security)', () => {
  let registry: PaymentProviderRegistry;
  let service: PaymentProviderService;
  let prismaService: any;
  let encryptionService: any;

  beforeEach(async () => {
    prismaService = {
      withoutTenantScope: jest.fn((callback) => callback(prismaService)),
      paymentProviderConfig: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
    };

    encryptionService = {
      encrypt: jest.fn((val) => `v1:mock:${val}`),
      decrypt: jest.fn((val) => val.replace('v1:mock:', '')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentProviderRegistry,
        PaymentProviderService,
        { provide: PrismaService, useValue: prismaService },
        { provide: EncryptionService, useValue: encryptionService },
        { provide: AuditLogService, useValue: { record: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    registry = module.get<PaymentProviderRegistry>(PaymentProviderRegistry);
    service = module.get<PaymentProviderService>(PaymentProviderService);
    registry.onModuleInit();
  });

  it('1. Registry contient l\'ensemble des 5 adaptateurs supportes (Wave, Orange Money, Bizao, Stripe, PayTech)', () => {
    expect(registry.listSupported()).toEqual(
      expect.arrayContaining(['WAVE', 'ORANGE_MONEY', 'BIZAO', 'STRIPE', 'PAYTECH']),
    );
    expect(registry.has('WAVE')).toBe(true);
    expect(registry.get('WAVE').provider).toBe('WAVE');
  });

  it('2. Service sanitized : Ne retourne JAMAIS encryptedSecret ou encryptedWebhookSecret en clair', async () => {
    prismaService.paymentProviderConfig.findMany.mockResolvedValue([
      {
        id: 'cfg-1',
        provider: 'WAVE',
        displayName: 'Wave Money',
        enabled: true,
        encryptedSecret: 'v1:mock:secret_wave',
        encryptedWebhookSecret: 'v1:mock:wh_secret_wave',
      },
    ]);

    const result = await service.findAll();
    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('encryptedSecret');
    expect(result[0]).not.toHaveProperty('encryptedWebhookSecret');
    expect(result[0].hasSecret).toBe(true);
    expect(result[0].hasWebhookSecret).toBe(true);
    expect(result[0].maskedSecret).toBe('••••••••');
  });

  it('3. Moteur d\'Idempotence Webhook : Rejette ou ignore les webhooks en doublon', async () => {
    prismaService.paymentProviderConfig.findUnique.mockResolvedValue({
      id: 'cfg-1',
      provider: 'WAVE',
      enabled: true,
      encryptedWebhookSecret: 'v1:mock:valid_secret',
    });

    const headers = { 'x-signature': 'valid_mock_signature' };
    const body = { externalTransactionId: 'TX-EXT-999', status: 'SUCCESS' };

    const firstCall = await service.handleWebhook('WAVE', headers, body);
    expect(firstCall.status).toBe('PROCESSED');

    // Deuxieme appel identique avec le meme externalTransactionId
    const secondCall = await service.handleWebhook('WAVE', headers, body);
    expect(secondCall.status).toBe('IGNORED_DUPLICATE');
  });
});
