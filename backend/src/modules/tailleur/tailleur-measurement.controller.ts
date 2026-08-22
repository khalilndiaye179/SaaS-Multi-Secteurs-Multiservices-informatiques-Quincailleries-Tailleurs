import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { TailleurMeasurementService } from './tailleur-measurement.service';
import { CreateMeasurementDto, UpdateMeasurementDto, CreateTailleurOrderDto, UpdateTailleurOrderStatusDto, UpdateTailleurOrderDto, CreateTailleurCatalogItemDto, RegisterPaymentDto } from './dto/measurement.dto';


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

  @Get('catalog/all')
  async findAllCatalogItems() {
    return this.measurementService.findAllCatalogItems();
  }

  @Post('catalog')
  async createCatalogItem(@Body() dto: CreateTailleurCatalogItemDto) {
    return this.measurementService.createCatalogItem(dto);
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

  @Put('orders/:id/payment')
  async registerPayment(@Param('id') id: string, @Body() dto: RegisterPaymentDto) {
    return this.measurementService.registerPayment(id, dto.amount);
  }

  @Post('orders/:id/delete')
  async removeOrder(@Param('id') id: string) {
    return this.measurementService.removeOrder(id);
  }

  @Get('collaborators')
  async getCollaborators() {
    return this.measurementService.getCollaborators();
  }


  @Get()
  async findAll() {
    return this.measurementService.findAll();
  }

  @Get(':id/members')
  async findMembers(@Param('id') id: string) {
    return this.measurementService.findMembers(id);
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


