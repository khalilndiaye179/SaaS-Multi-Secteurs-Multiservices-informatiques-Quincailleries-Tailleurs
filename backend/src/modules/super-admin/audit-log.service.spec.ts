import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditLogService (Metadata Sanitization)', () => {
  let service: AuditLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: PrismaService,
          useValue: {
            withoutTenantScope: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
  });

  it('1. Masque automatiquement les proprietes sensibles dans les metadonnees (Sanitization)', () => {
    const rawMetadata = {
      action: 'UPDATE_PROVIDER',
      apiKey: 'secret_api_key_123',
      encryptedSecret: 'v1:abcd',
      webhookSecret: 'whsec_99999',
      nested: {
        password: 'UserPass123!',
        normalField: 'Public Value',
      },
    };

    const sanitized = (service as any).sanitizeMetadata(rawMetadata);

    expect(sanitized.apiKey).toBe('[REDACTED_SECRET]');
    expect(sanitized.encryptedSecret).toBe('[REDACTED_SECRET]');
    expect(sanitized.webhookSecret).toBe('[REDACTED_SECRET]');
    expect(sanitized.nested.password).toBe('[REDACTED_SECRET]');
    expect(sanitized.nested.normalField).toBe('Public Value');
    expect(sanitized.action).toBe('UPDATE_PROVIDER');
  });
});
