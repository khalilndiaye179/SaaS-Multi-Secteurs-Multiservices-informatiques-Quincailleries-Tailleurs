import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../tenant/tenant-context.service';

@Injectable()
export class SubscriptionExpirationCron {
  private readonly logger = new Logger(SubscriptionExpirationCron.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleSubscriptionExpirations() {
    this.logger.log('[CRON] Vérification des expirations d’abonnements...');
    const now = new Date();

    // 1. Expiration des essais TRIAL_7D
    const expiredTrials = await TenantContextService.runWithSystemContext(async () => {
      return this.prisma.tenant.findMany({
        where: {
          billingStatus: 'TRIAL_7D',
          trialEndsAt: { lte: now },
        },
      });
    });

    for (const tenant of expiredTrials) {
      await TenantContextService.runWithTenantContext(tenant.id, tenant.sectorType, async () => {
        await this.prisma.tenant.update({
          where: { id: tenant.id },
          data: { billingStatus: 'EXPIRED' },
        });
        this.logger.warn(`[CRON] Trial 7D expiré pour le tenant: ${tenant.code} (${tenant.id})`);
      });
    }

    // 2. Expiration des abonnements payants ACTIVE
    const expiredSubscriptions = await TenantContextService.runWithSystemContext(async () => {
      return this.prisma.tenant.findMany({
        where: {
          billingStatus: 'ACTIVE',
          subscriptionEndsAt: { lte: now },
        },
      });
    });

    for (const tenant of expiredSubscriptions) {
      await TenantContextService.runWithTenantContext(tenant.id, tenant.sectorType, async () => {
        await this.prisma.tenant.update({
          where: { id: tenant.id },
          data: { billingStatus: 'EXPIRED' },
        });
        this.logger.warn(`[CRON] Abonnement payant expiré pour le tenant: ${tenant.code} (${tenant.id})`);
      });
    }
  }
}
