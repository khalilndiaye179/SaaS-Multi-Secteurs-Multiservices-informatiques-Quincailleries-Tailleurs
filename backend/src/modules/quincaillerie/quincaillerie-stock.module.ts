import { Module } from '@nestjs/common';
import { QuincaillerieStockController } from './quincaillerie-stock.controller';
import { QuincaillerieStockService } from './quincaillerie-stock.service';
import { QuincailleriePurchaseController } from './quincaillerie-purchase.controller';
import { QuincailleriePurchaseService } from './quincaillerie-purchase.service';
import { BusinessBillingModule } from '../billing/business-billing.module';
import { QuincaillerieInventoryController } from './quincaillerie-inventory.controller';
import { QuincaillerieInventoryService } from './quincaillerie-inventory.service';
import { DepotController } from './depot.controller';
import { DepotService } from './depot.service';

@Module({
  imports: [BusinessBillingModule],
  controllers: [
    QuincaillerieStockController,
    QuincailleriePurchaseController,
    QuincaillerieInventoryController,
    DepotController
  ],
  providers: [
    QuincaillerieStockService,
    QuincailleriePurchaseService,
    QuincaillerieInventoryService,
    DepotService
  ],
  exports: [
    QuincaillerieStockService, 
    QuincailleriePurchaseService, 
    QuincaillerieInventoryService,
    DepotService
  ],
})
export class QuincaillerieStockModule {}
