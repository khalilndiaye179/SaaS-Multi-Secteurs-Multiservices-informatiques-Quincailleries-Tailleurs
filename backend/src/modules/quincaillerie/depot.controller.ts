import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { DepotService } from './depot.service';
import { CreateDepotDto, UpdateDepotDto } from './dto/depot.dto';
import { SectorPermissionGuard } from '../../core/guards/sector-permission.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { RequirePermissions } from '../../core/guards/require-permissions.decorator';

@Controller('api/quincaillerie/depots')
@UseGuards(SectorPermissionGuard, PermissionsGuard)
export class DepotController {
  constructor(private readonly depotService: DepotService) {}

  @Get()
  findAll() {
    return this.depotService.findAll();
  }

  @Post()
  @RequirePermissions('stock:write')
  create(@Body() dto: CreateDepotDto) {
    return this.depotService.create(dto);
  }

  @Put(':id')
  @RequirePermissions('stock:write')
  update(@Param('id') id: string, @Body() dto: UpdateDepotDto) {
    return this.depotService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('stock:write')
  remove(@Param('id') id: string) {
    return this.depotService.remove(id);
  }
}
