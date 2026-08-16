import { Controller, Post, Get, Body, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingExempt } from '../auth/billing-exempt.decorator';
import { TenantContextService } from '../tenant/tenant-context.service';

@Controller('billing')
export class BillingController {
  constructor(private prisma: PrismaService) {}

  @BillingExempt()
  @Get('status')
  async getBillingStatus() {
    const tenantId = TenantContextService.getTenantId();
    if (!tenantId) {
      throw new BadRequestException('Contexte tenant introuvable.');
    }

    const tenant = await this.prisma.withoutTenantScope(async (client) => {
      return client.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          code: true,
          name: true,
          billingStatus: true,
          trialEndsAt: true,
          subscriptionEndsAt: true,
        },
      });
    });

    return tenant;
  }

  @BillingExempt()
  @Post('pay-proof')
  async submitPaymentProof(
    @Body('provider') provider: string,
    @Body('transactionRef') transactionRef: string,
    @Body('amount') amount: number,
    @Body('durationMonths') durationMonths: number,
  ) {
    const tenantId = TenantContextService.getTenantId();
    if (!tenantId) {
      throw new BadRequestException('Contexte tenant introuvable.');
    }

    if (!provider || !transactionRef || !amount) {
      throw new BadRequestException('Veuillez fournir tous les champs requis (provider, transactionRef, amount).');
    }

    return this.prisma.withoutTenantScope(async (client) => {
      return client.paymentProof.create({
        data: {
          tenantId,
          provider,
          transactionRef,
          amount: Number(amount),
          durationMonths: Number(durationMonths) || 1,
          status: 'PENDING',
        },
      });
    });
  }

  @BillingExempt()
  @Get('my-payment-proofs')
  async getMyPaymentProofs() {
    const tenantId = TenantContextService.getTenantId();
    if (!tenantId) {
      throw new BadRequestException('Contexte tenant introuvable.');
    }

    return this.prisma.withoutTenantScope(async (client) => {
      return client.paymentProof.findMany({
        where: { tenantId },
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          provider: true,
          transactionRef: true,
          amount: true,
          durationMonths: true,
          status: true,
          submittedAt: true,
          processedAt: true,
        },
      });
    });
  }
}

