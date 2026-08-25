import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../core/security/encryption.service';
import { AuditLogService } from '../super-admin/audit-log.service';
import { PaymentProviderRegistry } from './payment-provider.registry';
import { PaymentInitializationParams } from './adapters/payment-provider.adapter.interface';

export interface CreateProviderConfigDto {
  provider: string;
  displayName: string;
  enabled?: boolean;
  environment?: 'TEST' | 'PRODUCTION';
  currency?: string;
  publicKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  callbackUrl?: string;
}

@Injectable()
export class PaymentProviderService {
  private processedWebhooks = new Set<string>(); // Moteur d'idempotence des Webhooks

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private auditLogService: AuditLogService,
    private registry: PaymentProviderRegistry,
  ) {}

  /**
   * Masque les secrets avant envoi au frontend
   */
  private sanitizeForResponse(config: any) {
    const { encryptedSecret, encryptedWebhookSecret, ...safe } = config;
    return {
      ...safe,
      hasSecret: Boolean(encryptedSecret),
      hasWebhookSecret: Boolean(encryptedWebhookSecret),
      maskedSecret: encryptedSecret ? '••••••••' : null,
      maskedWebhookSecret: encryptedWebhookSecret ? '••••••••' : null,
    };
  }

  /**
   * Liste les configurations des fournisseurs (fusionne la BDD avec le Registre)
   */
  async findAll() {
    const configs = await this.prisma.withoutTenantScope(async (c) =>
      c.paymentProviderConfig.findMany({ orderBy: { provider: 'asc' } }),
    );
    
    const configMap = new Map(configs.map(c => [c.provider, this.sanitizeForResponse(c)]));
    
    // Injecte tous les fournisseurs supportés par le registry, même non configurés en BDD
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

  /**
   * Retourne uniquement les fournisseurs actifs pour les tenants (Frontend)
   */
  async findAllActive() {
    const configs = await this.prisma.withoutTenantScope(async (c) =>
      c.paymentProviderConfig.findMany({ 
        where: { enabled: true },
        orderBy: { provider: 'asc' } 
      }),
    );
    
    return configs.map(c => ({
      provider: c.provider,
      displayName: c.displayName,
      currency: c.currency,
      qrCodeUrl: c.qrCodeUrl,
    }));
  }

  /**
   * Récupère un fournisseur par sa clé
   */
  async findOne(provider: string) {
    const upperProvider = provider.toUpperCase();
    const config = await this.prisma.withoutTenantScope(async (c) =>
      c.paymentProviderConfig.findUnique({ where: { provider: upperProvider } }),
    );

    if (!config) {
      throw new NotFoundException(`Configuration du fournisseur '${upperProvider}' introuvable.`);
    }

    return this.sanitizeForResponse(config);
  }

  /**
   * Crée ou met à jour la configuration d'un fournisseur
   */
  async upsertConfig(dto: CreateProviderConfigDto) {
    const upperProvider = dto.provider.toUpperCase();
    if (!this.registry.has(upperProvider)) {
      throw new BadRequestException(`Le fournisseur '${upperProvider}' n'est pas supporté par la plateforme.`);
    }

    const existing = await this.prisma.withoutTenantScope(async (c) =>
      c.paymentProviderConfig.findUnique({ where: { provider: upperProvider } }),
    );

    const encryptedSecret = dto.secretKey ? this.encryptionService.encrypt(dto.secretKey) : existing?.encryptedSecret || null;
    const encryptedWebhookSecret = dto.webhookSecret ? this.encryptionService.encrypt(dto.webhookSecret) : existing?.encryptedWebhookSecret || null;

    const data: any = {
      provider: upperProvider,
      displayName: dto.displayName || upperProvider,
      enabled: dto.enabled ?? existing?.enabled ?? false,
      environment: dto.environment || existing?.environment || 'TEST',
      currency: dto.currency || existing?.currency || 'XOF',
      publicKey: dto.publicKey !== undefined ? dto.publicKey : existing?.publicKey || null,
      callbackUrl: dto.callbackUrl !== undefined ? dto.callbackUrl : existing?.callbackUrl || null,
      encryptedSecret,
      encryptedWebhookSecret,
    };

    const isEnvChange = existing && existing.environment !== data.environment;

    const updated = await this.prisma.withoutTenantScope(async (c) =>
      c.paymentProviderConfig.upsert({
        where: { provider: upperProvider },
        create: data,
        update: data,
      }),
    );

    // Audit de l'opération
    await this.auditLogService.record({
      action: existing ? 'PAYMENT_PROVIDER_UPDATE' : 'PAYMENT_PROVIDER_CREATE',
      resourceType: 'PAYMENT_PROVIDER_CONFIG',
      resourceId: updated.id,
      result: 'SUCCESS',
      metadata: {
        provider: upperProvider,
        environment: updated.environment,
        enabled: updated.enabled,
        isEnvChange,
      },
    });

    return this.sanitizeForResponse(updated);
  }

  /**
   * Upload et remplace le QR Code d'un fournisseur
   */
  async uploadQrCode(provider: string, buffer: Buffer, mimeType: string) {
    const upperProvider = provider.toUpperCase();
    if (!this.registry.has(upperProvider)) {
      throw new BadRequestException(`Le fournisseur '${upperProvider}' n'est pas supporté.`);
    }

    const existing = await this.prisma.withoutTenantScope(async (c) =>
      c.paymentProviderConfig.findUnique({ where: { provider: upperProvider } })
    );
    if (!existing) {
      throw new NotFoundException(`Configuration ${upperProvider} introuvable, créez d'abord le fournisseur avant d'uploader un QR code.`);
    }

    // Magic bytes check pour s'assurer que c'est une image (PNG/JPEG)
    const isPng = buffer.length > 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    const isJpeg = buffer.length > 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;

    if (!isPng && !isJpeg) {
      throw new BadRequestException("Le fichier n'est pas une image PNG ou JPEG valide.");
    }

    const base64Data = buffer.toString('base64');
    const dataUri = `data:${isPng ? 'image/png' : 'image/jpeg'};base64,${base64Data}`;

    const updated = await this.prisma.withoutTenantScope(async (c) =>
      c.paymentProviderConfig.update({
        where: { provider: upperProvider },
        data: { qrCodeUrl: dataUri }
      })
    );

    await this.auditLogService.record({
      action: 'PAYMENT_PROVIDER_QR_CODE_UPLOAD',
      resourceType: 'PAYMENT_PROVIDER_CONFIG',
      resourceId: updated.id,
      result: 'SUCCESS',
      metadata: { provider: upperProvider }
    });

    return this.sanitizeForResponse(updated);
  }

  /**
   * Révoque (supprime) le QR Code d'un fournisseur
   */
  async revokeQrCode(provider: string) {
    const upperProvider = provider.toUpperCase();
    
    const existing = await this.prisma.withoutTenantScope(async (c) =>
      c.paymentProviderConfig.findUnique({ where: { provider: upperProvider } })
    );
    if (!existing) {
      throw new NotFoundException(`Configuration ${upperProvider} introuvable, créez d'abord le fournisseur avant d'uploader un QR code.`);
    }

    const updated = await this.prisma.withoutTenantScope(async (c) =>
      c.paymentProviderConfig.update({
        where: { provider: upperProvider },
        data: { qrCodeUrl: null }
      })
    );

    await this.auditLogService.record({
      action: 'PAYMENT_PROVIDER_QR_CODE_REVOKE',
      resourceType: 'PAYMENT_PROVIDER_CONFIG',
      resourceId: updated.id,
      result: 'SUCCESS',
      metadata: { provider: upperProvider }
    });

    return this.sanitizeForResponse(updated);
  }
  /**
   * Bascule le statut d'activation (Enable / Disable)
   */
  async toggleEnabled(provider: string, enabled: boolean) {
    const upperProvider = provider.toUpperCase();
    const existing = await this.prisma.withoutTenantScope(async (c) =>
      c.paymentProviderConfig.findUnique({ where: { provider: upperProvider } }),
    );

    if (!existing) {
      throw new BadRequestException(`Veuillez d'abord configurer les clés d'API de '${upperProvider}' (via le bouton Configurer) avant de pouvoir l'activer.`);
    }

    // Validation avant activation
    if (enabled && (!existing.encryptedSecret || !existing.publicKey)) {
      throw new BadRequestException(`Impossible d'activer '${upperProvider}' : Les identifiants (Clés API/Secrets) sont incomplets.`);
    }

    const updated = await this.prisma.withoutTenantScope(async (c) =>
      c.paymentProviderConfig.update({
        where: { provider: upperProvider },
        data: { enabled },
      }),
    );

    await this.auditLogService.record({
      action: enabled ? 'PAYMENT_PROVIDER_ENABLE' : 'PAYMENT_PROVIDER_DISABLE',
      resourceType: 'PAYMENT_PROVIDER_CONFIG',
      resourceId: updated.id,
      result: 'SUCCESS',
      metadata: { provider: upperProvider, enabled },
    });

    return this.sanitizeForResponse(updated);
  }

  /**
   * Teste la connexion avec le fournisseur (Super Admin uniquement)
   */
  async testConnection(provider: string) {
    const upperProvider = provider.toUpperCase();
    const config = await this.prisma.withoutTenantScope(async (c) =>
      c.paymentProviderConfig.findUnique({ where: { provider: upperProvider } }),
    );

    if (!config) {
      throw new NotFoundException(`Fournisseur '${upperProvider}' non configuré.`);
    }

    const adapter = this.registry.get(upperProvider);

    const decryptedSecret = config.encryptedSecret ? this.encryptionService.decrypt(config.encryptedSecret) : null;
    const decryptedWebhookSecret = config.encryptedWebhookSecret ? this.encryptionService.decrypt(config.encryptedWebhookSecret) : null;

    const runtimeConfig = {
      ...config,
      decryptedSecret,
      decryptedWebhookSecret,
    };

    const testParams: PaymentInitializationParams = {
      amount: 1000,
      currency: config.currency,
      transactionRef: `TEST-CONN-${Date.now()}`,
      customerEmail: 'test.admin@doorwaar.sn',
    };

    try {
      const result = await adapter.initializePayment(testParams, runtimeConfig);

      await this.auditLogService.record({
        action: 'PAYMENT_PROVIDER_TEST',
        resourceType: 'PAYMENT_PROVIDER_CONFIG',
        resourceId: config.id,
        result: 'SUCCESS',
        metadata: { provider: upperProvider, success: result.success },
      });

      return {
        success: true,
        message: `Test de connexion réussi avec le fournisseur ${config.displayName} !`,
        details: result,
      };
    } catch (err: any) {
      await this.auditLogService.record({
        action: 'PAYMENT_PROVIDER_TEST',
        resourceType: 'PAYMENT_PROVIDER_CONFIG',
        resourceId: config.id,
        result: 'FAILURE',
        metadata: { provider: upperProvider, error: err.message },
      });

      throw new BadRequestException(`Échec du test de connexion avec ${config.displayName} : ${err.message}`);
    }
  }

  /**
   * Traitement d'un Webhook entrant avec validation HMAC et Idempotence (Secured & Fail-Closed)
   */
  async handleWebhook(provider: string, headers: Record<string, any>, body: any) {
    const upperProvider = provider.toUpperCase();

    // 1. Vérification du support par le registry (404 si inconnu)
    if (!this.registry.has(upperProvider)) {
      throw new NotFoundException(`Le fournisseur de paiement '${upperProvider}' n'est pas supporté par la plateforme.`);
    }

    // 2. Recherche de la configuration en base
    const config = await this.prisma.withoutTenantScope(async (c) =>
      c.paymentProviderConfig.findUnique({ where: { provider: upperProvider } }),
    );

    // 3. Rejet 403 si non configuré ou inactif
    if (!config || !config.enabled) {
      throw new ForbiddenException(`Le fournisseur de paiement '${upperProvider}' n'est pas actif.`);
    }

    // 4. R3 — Fail-Closed : Rejet 403 immédiat si aucun secret de webhook n'est configuré
    if (!config.encryptedWebhookSecret) {
      this.safeAuditRecord({
        action: 'PAYMENT_WEBHOOK_REJECTED',
        resourceType: 'PAYMENT_PROVIDER_CONFIG',
        resourceId: config.id,
        result: 'FORBIDDEN',
        metadata: { provider: upperProvider, reason: 'No webhook secret configured — fail-closed' },
      });
      throw new ForbiddenException(
        `Le fournisseur '${upperProvider}' n'a pas de secret de signature Webhook configuré.`
      );
    }

    try {
      const adapter = this.registry.get(upperProvider);
      const decryptedWebhookSecret = config.encryptedWebhookSecret ? this.encryptionService.decrypt(config.encryptedWebhookSecret) : null;

      const validation = await adapter.validateWebhook(headers, body, {
        ...config,
        decryptedWebhookSecret,
      });

      if (!validation.isValid) {
        this.safeAuditRecord({
          action: 'PAYMENT_WEBHOOK_REJECTED',
          resourceType: 'PAYMENT_PROVIDER_CONFIG',
          resourceId: config.id,
          result: 'FORBIDDEN',
          metadata: { provider: upperProvider, reason: 'Invalid Signature' },
        });
        throw new ForbiddenException('Signature de Webhook invalide.');
      }

      // Moteur d'Idempotence : Vérification de doublon
      const idempotencyKey = `${upperProvider}:${validation.externalTransactionId}`;
      if (this.processedWebhooks.has(idempotencyKey)) {
        return { status: 'IGNORED_DUPLICATE', message: 'Webhook déjà traité.' };
      }

      this.processedWebhooks.add(idempotencyKey);

      this.safeAuditRecord({
        action: 'PAYMENT_WEBHOOK_RECEIVED',
        resourceType: 'PAYMENT_PROVIDER_CONFIG',
        resourceId: config.id,
        result: 'SUCCESS',
        metadata: {
          provider: upperProvider,
          externalTransactionId: validation.externalTransactionId,
          status: validation.status,
          amount: validation.amount,
        },
      });

      return {
        status: 'PROCESSED',
        externalTransactionId: validation.externalTransactionId,
        paymentStatus: validation.status,
      };
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) {
        throw err;
      }
      // Fail-closed pour toute autre erreur inattendue sur endpoint public : 403 propre au lieu de 500
      throw new ForbiddenException(`Traitement du Webhook rejeté : ${err.message || 'Erreur de validation'}`);
    }
  }

  /**
   * Helper sécurisé d'enregistrement d'audit qui ne fait jamais crasher les routes publiques
   */
  private async safeAuditRecord(params: any) {
    try {
      await this.auditLogService.record(params);
    } catch (e) {
      // Ignoré silencieusement pour éviter qu'une erreur de contexte d'audit ne transforme une 403 en 500
    }
  }
}
