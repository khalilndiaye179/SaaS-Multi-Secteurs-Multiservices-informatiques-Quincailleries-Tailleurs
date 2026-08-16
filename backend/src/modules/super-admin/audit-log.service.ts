import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

const SENSITIVE_KEYS = [
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'apikey',
  'secret',
  'encryptedsecret',
  'webhooksecret',
  'encryptedwebhooksecret',
  'otp',
  'authorization',
  'cookie',
  'passwordhash',
];

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Sanitization automatique des métadonnées pour supprimer les secrets
   */
  private sanitizeMetadata(data: any): any {
    if (!data) return data;
    if (typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeMetadata(item));
    }

    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED_SECRET]';
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        sanitized[key] = this.sanitizeMetadata(data[key]);
      } else {
        sanitized[key] = data[key];
      }
    }
    return sanitized;
  }

  /**
   * Enregistre un événement d'audit (Append-Only)
   */
  async record(params: {
    action: string;
    resourceType: string;
    resourceId: string;
    result?: 'SUCCESS' | 'FAILURE' | 'FORBIDDEN';
    metadata?: Record<string, any>;
    tenantId?: string;
  }) {
    const store = TenantContextService.getStore();
    const actorUserId = store?.userId || 'SYSTEM';
    const actorRole = store?.isSuperAdmin ? 'SUPER_ADMIN' : store?.roles?.[0] || 'ANONYMOUS';
    const resolvedTenantId = params.tenantId || store?.tenantId || null;

    const sanitizedMeta = this.sanitizeMetadata(params.metadata);

    return this.prisma.withoutTenantScope(async (client) => {
      return client.auditLog.create({
        data: {
          actorUserId,
          actorRole,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          tenantId: resolvedTenantId,
          result: params.result || 'SUCCESS',
          metadata: sanitizedMeta,
        },
      });
    });
  }

  /**
   * Recherche sécurisée et paginée des logs d'audit (Lecture seule)
   */
  async find(query: {
    page?: number;
    limit?: number;
    tenantId?: string;
    actorUserId?: string;
    action?: string;
    resourceType?: string;
  }) {
    const store = TenantContextService.getStore();
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    // 🔒 SECURITE MULTI-TENANT FAIL-CLOSED
    if (!store?.isSuperAdmin) {
      if (!store?.tenantId) {
        return { data: [], total: 0, page, limit, totalPages: 0 };
      }
      where.tenantId = store.tenantId; // Restreint strictement au tenant connecté
    } else if (query.tenantId) {
      where.tenantId = query.tenantId;
    }

    if (query.actorUserId) where.actorUserId = query.actorUserId;
    if (query.action) where.action = query.action;
    if (query.resourceType) where.resourceType = query.resourceType;

    const [data, total] = await this.prisma.withoutTenantScope(async (client) => {
      return Promise.all([
        client.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        client.auditLog.count({ where }),
      ]);
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
