import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import { IS_BILLING_EXEMPT_KEY } from './billing-exempt.decorator';
import { TenantContextService } from '../tenant/tenant-context.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BillingStatusGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isBillingExempt = this.reflector.getAllAndOverride<boolean>(
      IS_BILLING_EXEMPT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic || isBillingExempt) {
      return true;
    }

    const store = TenantContextService.getStore();

    if (!store || store.isSuperAdmin || store.isSystemContext) {
      return true;
    }

    if (!store.tenantId) {
      return true; // TenantGuard s'est déjà chargé de cela
    }

    // Récupération de l'état de facturation du tenant
    const tenant = await this.prisma.withoutTenantScope(async (client) => {
      return client.tenant.findUnique({
        where: { id: store.tenantId },
        select: { billingStatus: true },
      });
    });

    if (!tenant) {
      return true;
    }

    if (tenant.billingStatus === 'EXPIRED' || tenant.billingStatus === 'SUSPENDED') {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED, // 402 Payment Required
          code: tenant.billingStatus === 'EXPIRED' ? 'BILLING_EXPIRED' : 'TENANT_SUSPENDED',
          message:
            tenant.billingStatus === 'EXPIRED'
              ? 'Votre période d’essai ou abonnement a expiré. Veuillez renouveler.'
              : 'Votre compte entreprise est suspendu. Veuillez contacter le support.',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}
