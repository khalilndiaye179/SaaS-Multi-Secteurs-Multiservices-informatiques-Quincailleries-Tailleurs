import { Module } from '@nestjs/common';
import { QuincaillerieStockController } from './quincaillerie-stock.controller';
import { QuincaillerieStockService } from './quincaillerie-stock.service';
import { QuincailleriePurchaseController } from './quincaillerie-purchase.controller';
import { QuincailleriePurchaseService } from './quincaillerie-purchase.service';
import { BusinessBillingModule } from '../billing/business-billing.module';
import { QuincaillerieInventoryController } from './quincaillerie-inventory.controller';
import { QuincaillerieInventoryService } from './quincaillerie-inventory.service';

@Module({
  imports: [BusinessBillingModule],
  controllers: [
    QuincaillerieStockController,
    QuincailleriePurchaseController,
    QuincaillerieInventoryController
  ],
  providers: [
    QuincaillerieStockService,
    QuincailleriePurchaseService,
    QuincaillerieInventoryService
  ],
  exports: [QuincaillerieStockService, QuincailleriePurchaseService, QuincaillerieInventoryService],
})
export class QuincaillerieStockModule {}
