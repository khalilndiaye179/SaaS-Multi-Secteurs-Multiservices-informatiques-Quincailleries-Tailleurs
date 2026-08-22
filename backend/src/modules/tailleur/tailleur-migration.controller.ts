import { Controller, Post, UseGuards } from '@nestjs/common';
import { SuperAdminGuard } from '../../core/guards/super-admin.guard';
import { TailleurMeasurementService } from './tailleur-measurement.service';

@Controller('tailleur/migration')
@UseGuards(SuperAdminGuard)
export class TailleurMigrationController {
  constructor(private measurementService: TailleurMeasurementService) {}

  @Post('orphan-invoices')
  async migrateOrphanOrders() {
    return this.measurementService.migrateOrphanOrders();
  }
}
