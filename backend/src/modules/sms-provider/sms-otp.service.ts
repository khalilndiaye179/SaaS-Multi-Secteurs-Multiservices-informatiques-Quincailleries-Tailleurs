import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';
import { SmsProviderService } from './sms-provider.service';
import { SmsProviderRegistry } from './sms-provider.registry';
import { EncryptionService } from '../../core/security/encryption.service';
import { AuditLogService } from '../super-admin/audit-log.service';

interface OtpStoreItem {
  hashedOtp: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

@Injectable()
export class SmsOtpService {
  // In-Memory Secure Cache avec TTL (En environnement distribuÃ©, Redis prend le relais)
  private otpCache = new Map<string, OtpStoreItem>();

  constructor(
    private smsProviderService: SmsProviderService,
    private registry: SmsProviderRegistry,
    private encryptionService: EncryptionService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Normalisation du numÃ©ro au format international (+221, +225, +223, etc.)
   */
  normalizePhoneNumber(phone: string): string {
    if (!phone) throw new BadRequestException('NumÃ©ro de tÃ©lÃ©phone obligatoire.');
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.substring(2);
    } else if (!cleaned.startsWith('+')) {
      // Par dÃ©faut pour les numÃ©ros Ã  9 chiffres du SÃ©nÃ©gal (77, 78, 70, 76)
      if (cleaned.length === 9) {
        cleaned = '+221' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }
    return cleaned;
  }

  /**
   * Hashage cryptographique de l'OTP
   */
  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /**
   * GÃ©nÃ©ration et envoi d'un OTP sÃ©curisÃ©
   */
  async sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    const normalizedPhone = this.normalizePhoneNumber(phone);
    const now = Date.now();

    const existing = this.otpCache.get(normalizedPhone);

    // ðŸ”’ SECURITE 1 : Anti-Resend Flooding (60 secondes d'attente minimale)
    if (existing && now - existing.lastSentAt < 60000) {
      const waitSeconds = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
      throw new HttpException(
        `Veuillez patienter ${waitSeconds} seconde(s) avant de demander un nouveau code OTP.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // ðŸ”’ SECURITE 2 : GÃ©nÃ©ration cryptographique sÃ»re Ã  6 chiffres
    const randomBuffer = crypto.randomBytes(4);
    const num = randomBuffer.readUInt32BE(0) % 1000000;
    const otp = num.toString().padStart(6, '0');
    const hashedOtp = this.hashOtp(otp);

    const ttlMs = 5 * 60 * 1000; // Expiration 5 minutes
    const expiresAt = now + ttlMs;

    this.otpCache.set(normalizedPhone, {
      hashedOtp,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    });

    const activeConfig = await this.smsProviderService.getActiveProvider();
    const adapter = this.registry.get(activeConfig.provider);

    const decryptedSecret = (activeConfig as any).encryptedSecret
      ? this.encryptionService.decrypt((activeConfig as any).encryptedSecret)
      : null;

    const templateMessage = `Votre code de vÃ©rification KPSyDesk est : ${otp}. Il expire dans 5 minutes. Ne le communiquez Ã  personne.`;

    const sendResult = await adapter.sendSms(
      {
        toPhone: normalizedPhone,
        message: templateMessage,
        senderId: activeConfig.senderId,
      },
      { ...activeConfig, decryptedSecret },
    );

    const maskedPhone = normalizedPhone.replace(/(\+\d{3})\d+(\d{2})/, '$1****$2');

    await this.auditLogService.record({
      action: 'OTP_SENT',
      resourceType: 'SMS_OTP',
      resourceId: maskedPhone,
      result: 'SUCCESS',
      metadata: { provider: activeConfig.provider, maskedPhone },
    });

    return {
      success: true,
      message: 'Si les informations sont valides, un code OTP de 6 chiffres a Ã©tÃ© transmis par SMS.',
    };
  }

  /**
   * VÃ©rification sÃ©curisÃ©e d'un OTP
   */
  async verifyOtp(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
    const normalizedPhone = this.normalizePhoneNumber(phone);
    const maskedPhone = normalizedPhone.replace(/(\+\d{3})\d+(\d{2})/, '$1****$2');
    const item = this.otpCache.get(normalizedPhone);

    // ðŸ”’ SECURITE 3 : RÃ©ponse gÃ©nÃ©rique Anti-Ã‰numÃ©ration
    if (!item) {
      await this.auditLogService.record({
        action: 'OTP_VERIFICATION_FAILED',
        resourceType: 'SMS_OTP',
        resourceId: maskedPhone,
        result: 'FAILURE',
        metadata: { reason: 'No OTP generated or already expired' },
      });
      throw new BadRequestException('Code OTP invalide ou expirÃ©.');
    }

    // ðŸ”’ SECURITE 4 : Expiration stricte (5 minutes)
    if (Date.now() > item.expiresAt) {
      this.otpCache.delete(normalizedPhone);
      await this.auditLogService.record({
        action: 'OTP_EXPIRED',
        resourceType: 'SMS_OTP',
        resourceId: maskedPhone,
        result: 'FAILURE',
      });
      throw new BadRequestException('Le code OTP a expirÃ©. Veuillez en solliciter un nouveau.');
    }

    // ðŸ”’ SECURITE 5 : Protection Brute-Force (5 tentatives max)
    if (item.attempts >= 5) {
      this.otpCache.delete(normalizedPhone);
      await this.auditLogService.record({
        action: 'OTP_LOCKED',
        resourceType: 'SMS_OTP',
        resourceId: maskedPhone,
        result: 'FORBIDDEN',
        metadata: { reason: 'Max attempts exceeded' },
      });
      throw new HttpException(
        'Nombre maximal de tentatives dÃ©passÃ©. L\'OTP a Ã©tÃ© verrouillÃ©.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    item.attempts += 1;

    const inputHash = this.hashOtp(otp);

    // Comparaison temporelle constante pour empÃªcher le timing attack
    const isMatch = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(item.hashedOtp));

    if (!isMatch) {
      await this.auditLogService.record({
        action: 'OTP_VERIFICATION_FAILED',
        resourceType: 'SMS_OTP',
        resourceId: maskedPhone,
        result: 'FAILURE',
        metadata: { attemptsRemaining: 5 - item.attempts },
      });
      throw new BadRequestException('Code OTP incorrect.');
    }

    // ðŸ”’ SECURITE 6 : Invalidation immÃ©diate aprÃ¨s succÃ¨s (Usage unique)
    this.otpCache.delete(normalizedPhone);

    await this.auditLogService.record({
      action: 'OTP_VERIFICATION_SUCCESS',
      resourceType: 'SMS_OTP',
      resourceId: maskedPhone,
      result: 'SUCCESS',
    });

    return {
      success: true,
      message: 'Code OTP validÃ© avec succÃ¨s !',
    };
  }
}



