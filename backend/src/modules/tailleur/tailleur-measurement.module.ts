import { Module } from '@nestjs/common';
import { TailleurMeasurementController } from './tailleur-measurement.controller';
import { TailleurMeasurementService } from './tailleur-measurement.service';

@Module({
  controllers: [TailleurMeasurementController],
  providers: [TailleurMeasurementService],
  exports: [TailleurMeasurementService],
})
export class TailleurMeasurementModule {}
