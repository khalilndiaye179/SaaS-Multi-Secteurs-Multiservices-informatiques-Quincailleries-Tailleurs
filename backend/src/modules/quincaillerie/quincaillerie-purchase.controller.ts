import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { QuincailleriePurchaseService } from './quincaillerie-purchase.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/purchase-order.dto';
import { SectorPermissionGuard } from '../../core/guards/sector-permission.guard';
import { RequireSector } from '../../core/tenant/sector.decorator';
import { SectorType } from '../../core/types/tenant.types';

@Controller('quincaillerie/purchases')
@UseGuards(SectorPermissionGuard)
@RequireSector(SectorType.QUINCAILLERIE)
export class QuincailleriePurchaseController {
  constructor(private readonly purchaseService: QuincailleriePurchaseService) {}

  @Get()
  async findAll() {
    return this.purchaseService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.purchaseService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreatePurchaseOrderDto) {
    return this.purchaseService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.purchaseService.update(id, dto);
  }

  @Patch(':id/receive')
  async markAsReceived(@Param('id') id: string) {
    return this.purchaseService.markAsReceived(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.purchaseService.delete(id);
  }
}
