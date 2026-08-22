import { Module } from '@nestjs/common';
import { TailleurMeasurementController } from './tailleur-measurement.controller';
import { TailleurMigrationController } from './tailleur-migration.controller';
import { TailleurMeasurementService } from './tailleur-measurement.service';
import { BusinessBillingModule } from '../billing/business-billing.module';

@Module({
  imports: [BusinessBillingModule],
  controllers: [TailleurMeasurementController, TailleurMigrationController],
  providers: [TailleurMeasurementService],
  exports: [TailleurMeasurementService],
})
export class TailleurMeasurementModule {}

