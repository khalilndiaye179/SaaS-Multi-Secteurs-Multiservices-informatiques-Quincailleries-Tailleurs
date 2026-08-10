import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { TailleurMeasurementService } from './tailleur-measurement.service';
import { CreateMeasurementDto, UpdateMeasurementDto, CreateTailleurOrderDto, UpdateTailleurOrderStatusDto, UpdateTailleurOrderDto } from './dto/measurement.dto';


import { SectorPermissionGuard } from '../../core/guards/sector-permission.guard';
import { RequireSector } from '../../core/tenant/sector.decorator';
import { SectorType } from '../../core/types/tenant.types';

@Controller('tailleur/measurements')
@UseGuards(SectorPermissionGuard)
@RequireSector(SectorType.TAILLEUR)
export class TailleurMeasurementController {
  constructor(private measurementService: TailleurMeasurementService) {}

  @Get('stats/overview')
  async getTailleurStats() {
    return this.measurementService.getTailleurStats();
  }

  @Get('orders/all')
  async findAllOrders() {
    return this.measurementService.findAllOrders();
  }


  @Post('orders')
  async createOrder(@Body() dto: CreateTailleurOrderDto) {
    return this.measurementService.createOrder(dto);
  }

  @Put('orders/:id/status')
  async updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateTailleurOrderStatusDto) {
    return this.measurementService.updateOrderStatus(id, dto);
  }

  @Put('orders/:id')
  async updateOrder(@Param('id') id: string, @Body() dto: UpdateTailleurOrderDto) {
    return this.measurementService.updateOrder(id, dto);
  }

  @Post('orders/:id/delete')
  async removeOrder(@Param('id') id: string) {
    return this.measurementService.removeOrder(id);
  }


  @Get()
  async findAll() {
    return this.measurementService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.measurementService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateMeasurementDto) {
    return this.measurementService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateMeasurementDto) {
    return this.measurementService.update(id, dto);
  }

  @Post(':id/delete')
  async remove(@Param('id') id: string) {
    return this.measurementService.remove(id);
  }
}


