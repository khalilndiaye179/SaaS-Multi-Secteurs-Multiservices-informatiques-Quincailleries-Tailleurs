import { Module } from '@nestjs/common';
import { SuperAdminBillingService } from './super-admin-billing.service';
import { SuperAdminBillingController } from './super-admin-billing.controller';
import { PricingCalculatorService } from '../billing/pricing-calculator.service';

@Module({
  providers: [SuperAdminBillingService, PricingCalculatorService],
  controllers: [SuperAdminBillingController],
  exports: [SuperAdminBillingService],
})
export class SuperAdminBillingModule {}
