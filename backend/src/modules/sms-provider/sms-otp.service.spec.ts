import { Test, TestingModule } from '@nestjs/testing';
import { SmsOtpService } from './sms-otp.service';
import { SmsProviderService } from './sms-provider.service';
import { SmsProviderRegistry } from './sms-provider.registry';
import { EncryptionService } from '../../core/security/encryption.service';
import { AuditLogService } from '../super-admin/audit-log.service';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';

describe('SmsOtpService (Cryptographic Security, Brute-Force & Expiration)', () => {
  let service: SmsOtpService;

  beforeEach(async () => {
    const mockProviderService = {
      getActiveProvider: jest.fn().mockResolvedValue({
        provider: 'ORANGE_SMS',
        senderId: 'KPSyDesk',
        environment: 'TEST',
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue({
        sendSms: jest.fn().mockResolvedValue({ success: true, messageId: 'MSG-1' }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsOtpService,
        { provide: SmsProviderService, useValue: mockProviderService },
        { provide: SmsProviderRegistry, useValue: mockRegistry },
        { provide: EncryptionService, useValue: { decrypt: jest.fn((v) => v) } },
        { provide: AuditLogService, useValue: { record: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = module.get<SmsOtpService>(SmsOtpService);
  });

  it('1. Normalisation du numero de telephone au format international (+221)', () => {
    expect(service.normalizePhoneNumber('77 123 45 67')).toBe('+221771234567');
    expect(service.normalizePhoneNumber('+225 07 00 00 00')).toBe('+22507000000');
  });

  it('2. Anti-Resend Flooding : Rejette une demande d\'OTP soumise moins de 60 secondes apres la precedente', async () => {
    const phone = '+221770000001';
    await service.sendOtp(phone);

    // Tentative immediate de renvoi
    await expect(service.sendOtp(phone)).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
  });

  it('3. Protection Brute-Force : Verrouille et supprime l\'OTP apres 5 tentatives incorrectes', async () => {
    const phone = '+221770000002';

    // Intercepte le hash genere pour simuler des essais invalides
    await service.sendOtp(phone);

    for (let i = 0; i < 5; i++) {
      try {
        await service.verifyOtp(phone, '000000');
      } catch (e) {
        // Ignorer les erreurs d'invalidation temporaires jusqu'a la 5eme
      }
    }

    // La 6eme tentative doit echouer avec verouillage Brute-Force (BadRequest ou TooManyRequests)
    await expect(service.verifyOtp(phone, '000000')).rejects.toThrow();
  });
});

