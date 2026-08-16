import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingDocumentType } from '@prisma/client';

@Injectable()
export class BillingSequenceService {
  constructor(private prisma: PrismaService) {}

  async getNextSequenceNumber(
    tenantId: string,
    type: BillingDocumentType,
    prefix: string,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const sequence = await this.prisma.extended.billingSequence.upsert({
      where: { tenantId_year_type: { tenantId, year, type } },
      create: { tenantId, year, type, currentValue: 1 },
      update: { currentValue: { increment: 1 } },
    });
    return `${prefix}-${year}-${sequence.currentValue.toString().padStart(4, '0')}`;
  }
}
