import { Module } from '@nestjs/common';
import { SaaSQuoteService } from './saas-quote.service';
import { SaaSQuoteController } from './saas-quote.controller';
import { PricingCalculatorService } from '../billing/pricing-calculator.service';
import { SaaSPdfGeneratorService } from './saas-pdf-generator.service';

@Module({
  providers: [SaaSQuoteService, PricingCalculatorService, SaaSPdfGeneratorService],
  controllers: [SaaSQuoteController],
  exports: [SaaSQuoteService, SaaSPdfGeneratorService],
})
export class SaaSQuoteModule {}
