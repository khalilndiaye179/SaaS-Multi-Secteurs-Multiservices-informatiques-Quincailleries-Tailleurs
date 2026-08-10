import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { QuincaillerieStockService } from './quincaillerie-stock.service';
import { CreateStockItemDto, UpdateStockItemDto, RecordMovementDto, DirectSaleDto } from './dto/stock.dto';
import { SectorPermissionGuard } from '../../core/guards/sector-permission.guard';
import { RequireSector } from '../../core/tenant/sector.decorator';
import { SectorType } from '../../core/types/tenant.types';

@Controller('quincaillerie/stock')
@UseGuards(SectorPermissionGuard)
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

  @Post(':id/movement')
  async recordMovement(@Param('id') id: string, @Body() dto: RecordMovementDto) {
    return this.stockService.recordMovement(id, dto);
  }

  @Post('sales')
  async recordDirectSale(@Body() dto: DirectSaleDto) {
    return this.stockService.recordDirectSale(dto.lines);
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

