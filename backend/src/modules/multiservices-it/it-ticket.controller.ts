import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ITMultiservicesTicketService } from './it-ticket.service';
import { CreateTicketDto, UpdateTicketStatusDto } from './dto/ticket.dto';
import { SectorPermissionGuard } from '../../core/guards/sector-permission.guard';
import { RequireSector } from '../../core/tenant/sector.decorator';
import { SectorType } from '../../core/types/tenant.types';

@Controller('multiservices-it/tickets')
@UseGuards(SectorPermissionGuard)
@RequireSector(SectorType.MULTISERVICES_IT)
export class ITMultiservicesTicketController {
  constructor(private ticketService: ITMultiservicesTicketService) {}

  @Get()
  async findAll() {
    return this.ticketService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ticketService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateTicketDto) {
    return this.ticketService.create(dto);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateTicketStatusDto) {
    return this.ticketService.updateStatus(id, dto);
  }

  @Get('stats/overview')
  async getStats() {
    return this.ticketService.getStats();
  }
}

