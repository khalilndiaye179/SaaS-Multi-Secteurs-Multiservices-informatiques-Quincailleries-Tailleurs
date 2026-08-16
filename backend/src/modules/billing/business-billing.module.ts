import { Module } from '@nestjs/common';
import { BusinessBillingService } from './business-billing.service';
import { BusinessBillingController } from './business-billing.controller';
import { PrismaModule } from '../../prisma/prisma.module';

import { PricingCalculatorService } from './pricing-calculator.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { BillingSequenceService } from './billing-sequence.service';

@Module({
  imports: [PrismaModule],
  controllers: [BusinessBillingController],
  providers: [BusinessBillingService, PricingCalculatorService, PdfGeneratorService, BillingSequenceService],
  exports: [BusinessBillingService, PricingCalculatorService, PdfGeneratorService, BillingSequenceService],
})
export class BusinessBillingModule {}


