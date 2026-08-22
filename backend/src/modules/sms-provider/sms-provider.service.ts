import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../core/security/encryption.service';
import { AuditLogService } from '../super-admin/audit-log.service';
import { SmsProviderRegistry } from './sms-provider.registry';

export interface CreateSmsConfigDto {
  provider: string;
  displayName: string;
  enabled?: boolean;
  environment?: 'TEST' | 'PRODUCTION';
  senderId?: string;
  apiUrl?: string;
  secretKey?: string;
}

@Injectable()
export class SmsProviderService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private auditLogService: AuditLogService,
    private registry: SmsProviderRegistry,
  ) {}

  private sanitizeForResponse(config: any) {
    const { encryptedSecret, ...safe } = config;
    return {
      ...safe,
      hasSecret: Boolean(encryptedSecret),
      maskedSecret: encryptedSecret ? '••••••••' : null,
    };
  }

  async findAll() {
    const configs = await this.prisma.withoutTenantScope(async (c) =>
      c.smsProviderConfig.findMany({ orderBy: { provider: 'asc' } }),
    );
    
    const configMap = new Map(configs.map(c => [c.provider, this.sanitizeForResponse(c)]));
    
    return this.registry.listSupported().map(providerCode => {
      if (configMap.has(providerCode)) {
        return configMap.get(providerCode);
      }
      return {
        provider: providerCode,
        displayName: providerCode,
        enabled: false,
        environment: 'TEST',
        hasSecret: false,
      };
    });
  }

  async findOne(provider: string) {
    const upperProvider = provider.toUpperCase();
    const config = await this.prisma.withoutTenantScope(async (c) =>
      c.smsProviderConfig.findUnique({ where: { provider: upperProvider } }),
    );

    if (!config) {
      throw new NotFoundException(`Configuration du fournisseur SMS '${upperProvider}' introuvable.`);
    }

    return this.sanitizeForResponse(config);
  }

  async upsertConfig(dto: CreateSmsConfigDto) {
    const upperProvider = dto.provider.toUpperCase();
    if (!this.registry.has(upperProvider)) {
      throw new BadRequestException(`Le fournisseur SMS '${upperProvider}' n'est pas supporté par la plateforme.`);
    }

    const existing = await this.prisma.withoutTenantScope(async (c) =>
      c.smsProviderConfig.findUnique({ where: { provider: upperProvider } }),
    );

    const encryptedSecret = dto.secretKey ? this.encryptionService.encrypt(dto.secretKey) : existing?.encryptedSecret || null;

    const data: any = {
      provider: upperProvider,
      displayName: dto.displayName || upperProvider,
      enabled: dto.enabled ?? existing?.enabled ?? false,
      environment: dto.environment || existing?.environment || 'TEST',
      senderId: dto.senderId || existing?.senderId || 'KPSyDesk',
      apiUrl: dto.apiUrl !== undefined ? dto.apiUrl : existing?.apiUrl || null,
      encryptedSecret,
    };

    const updated = await this.prisma.withoutTenantScope(async (c) =>
      c.smsProviderConfig.upsert({
        where: { provider: upperProvider },
        create: data,
        update: data,
      }),
    );

    await this.auditLogService.record({
      action: existing ? 'SMS_PROVIDER_UPDATE' : 'SMS_PROVIDER_CREATE',
      resourceType: 'SMS_PROVIDER_CONFIG',
      resourceId: updated.id,
      result: 'SUCCESS',
      metadata: { provider: upperProvider, enabled: updated.enabled, senderId: updated.senderId },
    });

    return this.sanitizeForResponse(updated);
  }

  async toggleEnabled(provider: string, enabled: boolean) {
    const upperProvider = provider.toUpperCase();
    const existing = await this.prisma.withoutTenantScope(async (c) =>
      c.smsProviderConfig.findUnique({ where: { provider: upperProvider } }),
    );

    if (!existing) {
      throw new BadRequestException(`Veuillez d'abord configurer les clés d'API de '${upperProvider}' (via le bouton Configurer) avant de pouvoir l'activer.`);
    }

    if (enabled && !existing.encryptedSecret) {
      throw new BadRequestException(`Impossible d'activer '${upperProvider}' : Les identifiants secrets sont manquants.`);
    }

    const updated = await this.prisma.withoutTenantScope(async (c) =>
      c.smsProviderConfig.update({
        where: { provider: upperProvider },
        data: { enabled },
      }),
    );

    await this.auditLogService.record({
      action: enabled ? 'SMS_PROVIDER_ENABLE' : 'SMS_PROVIDER_DISABLE',
      resourceType: 'SMS_PROVIDER_CONFIG',
      resourceId: updated.id,
      result: 'SUCCESS',
      metadata: { provider: upperProvider, enabled },
    });

    return this.sanitizeForResponse(updated);
  }

  async testConnection(provider: string) {
    const upperProvider = provider.toUpperCase();
    const config = await this.prisma.withoutTenantScope(async (c) =>
      c.smsProviderConfig.findUnique({ where: { provider: upperProvider } }),
    );

    if (!config) {
      throw new NotFoundException(`Fournisseur SMS '${upperProvider}' non configuré.`);
    }

    const adapter = this.registry.get(upperProvider);
    const decryptedSecret = config.encryptedSecret ? this.encryptionService.decrypt(config.encryptedSecret) : null;

    try {
      const result = await adapter.testConnection({ ...config, decryptedSecret });

      await this.auditLogService.record({
        action: 'SMS_PROVIDER_TEST',
        resourceType: 'SMS_PROVIDER_CONFIG',
        resourceId: config.id,
        result: 'SUCCESS',
        metadata: { provider: upperProvider, success: result.success },
      });

      return result;
    } catch (err: any) {
      await this.auditLogService.record({
        action: 'SMS_PROVIDER_TEST',
        resourceType: 'SMS_PROVIDER_CONFIG',
        resourceId: config.id,
        result: 'FAILURE',
        metadata: { provider: upperProvider, error: err.message },
      });

      throw new BadRequestException(`Échec du test SMS avec ${config.displayName} : ${err.message}`);
    }
  }

  /**
   * Sélectionne le fournisseur SMS actif de manière déterministe
   */
  async getActiveProvider() {
    const active = await this.prisma.withoutTenantScope(async (c) =>
      c.smsProviderConfig.findFirst({
        where: { enabled: true },
        orderBy: { updatedAt: 'desc' },
      }),
    );

    if (!active) {
      // Fallback automatique vers l'adaptateur Orange SMS en mode TEST si aucun n'est configuré en BDD
      return {
        provider: 'ORANGE_SMS',
        displayName: 'Orange SMS Default',
        senderId: 'KPSyDesk',
        environment: 'TEST',
      };
    }

    return active;
  }

  /**
   * Normalisation du numéro au format international (+221, +225, +223, etc.)
   */
  normalizePhoneNumber(phone: string): string {
    if (!phone) throw new BadRequestException('Numéro de téléphone obligatoire.');
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.substring(2);
    } else if (!cleaned.startsWith('+')) {
      // Par défaut pour les numéros à 9 chiffres du Sénégal (77, 78, 70, 76)
      if (cleaned.length === 9) {
        cleaned = '+221' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }
    return cleaned;
  }

  /**
   * Envoi d'une notification SMS standard (hors OTP)
   */
  async sendNotification(phone: string, message: string): Promise<{ success: boolean; message: string }> {
    const normalizedPhone = this.normalizePhoneNumber(phone);
    const activeConfig = await this.getActiveProvider();
    
    // Si on est en mode TEST et qu'aucun vrai provider n'est dispo, on log juste
    if (!this.registry.has(activeConfig.provider)) {
      console.log(`[SMS MOCK] To: ${normalizedPhone} | Msg: ${message}`);
      return { success: true, message: 'SMS simulé (Mode Test)' };
    }

    const adapter = this.registry.get(activeConfig.provider);

    const decryptedSecret = (activeConfig as any).encryptedSecret
      ? this.encryptionService.decrypt((activeConfig as any).encryptedSecret)
      : null;

    const sendResult = await adapter.sendSms(
      {
        toPhone: normalizedPhone,
        message: message,
        senderId: activeConfig.senderId,
      },
      { ...activeConfig, decryptedSecret },
    );

    const maskedPhone = normalizedPhone.replace(/(\+\d{3})\d+(\d{2})/, '$1****$2');

    await this.auditLogService.record({
      action: 'SMS_NOTIFICATION_SENT',
      resourceType: 'SMS_NOTIFICATION',
      resourceId: maskedPhone,
      result: 'SUCCESS',
      metadata: { provider: activeConfig.provider, maskedPhone },
    });

    return {
      success: true,
      message: 'Notification SMS envoyée.',
    };
  }
}
