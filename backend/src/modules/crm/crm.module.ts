import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';

@Module({
  controllers: [ClientController, SupplierController],
  providers: [ClientService, SupplierService],
  exports: [ClientService, SupplierService],
})
export class CrmModule {}
