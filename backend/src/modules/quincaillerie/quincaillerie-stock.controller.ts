import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { QuincaillerieStockService } from './quincaillerie-stock.service';
import { CreateStockItemDto, UpdateStockItemDto, RecordMovementDto, DirectSaleDto, TransferStockDto } from './dto/stock.dto';
import { SectorPermissionGuard } from '../../core/guards/sector-permission.guard';
import { RequireSector } from '../../core/tenant/sector.decorator';
import { SectorType } from '../../core/types/tenant.types';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { RequirePermissions } from '../../core/guards/require-permissions.decorator';

@Controller('quincaillerie/stock')
@UseGuards(SectorPermissionGuard, PermissionsGuard)
@RequireSector(SectorType.QUINCAILLERIE)
export class QuincaillerieStockController {
  constructor(private stockService: QuincaillerieStockService) {}

  @Get()
  async findAll() {
    return this.stockService.findAll();
  }

  @Get('alerts')
  async findAlerts() {
    return this.stockService.findAlerts();
  }

  @Post()
  async create(@Body() dto: CreateStockItemDto) {
    return this.stockService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateStockItemDto) {
    return this.stockService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.stockService.remove(id);
  }

  @Post('transfer')
  async transferStock(@Body() dto: TransferStockDto) {
    return this.stockService.transferStock(dto);
  }

  @Post(':id/movement')
  async recordMovement(@Param('id') id: string, @Body() dto: RecordMovementDto) {
    return this.stockService.recordMovement(id, dto);
  }

  @Post('sales')
  async recordDirectSale(@Body() dto: DirectSaleDto) {
    return this.stockService.recordDirectSale(dto);
  }

  @Get('reports')
  async getStockReport() {
    return this.stockService.getStockReport();
  }

  @Get('movements')
  async getMovementsHistory() {
    return this.stockService.getMovementsHistory();
  }
}

