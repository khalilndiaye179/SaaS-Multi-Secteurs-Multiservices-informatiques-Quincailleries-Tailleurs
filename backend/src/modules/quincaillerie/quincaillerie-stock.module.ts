import { Module } from '@nestjs/common';
import { QuincaillerieStockController } from './quincaillerie-stock.controller';
import { QuincaillerieStockService } from './quincaillerie-stock.service';

@Module({
  controllers: [QuincaillerieStockController],
  providers: [QuincaillerieStockService],
  exports: [QuincaillerieStockService],
})
export class QuincaillerieStockModule {}
