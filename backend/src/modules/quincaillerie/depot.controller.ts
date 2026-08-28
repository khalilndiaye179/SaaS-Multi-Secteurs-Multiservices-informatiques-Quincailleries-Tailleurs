import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { DepotService } from './depot.service';
import { CreateDepotDto, UpdateDepotDto } from './dto/depot.dto';
import { SectorPermissionGuard } from '../../core/guards/sector-permission.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { RequirePermissions } from '../../core/guards/require-permissions.decorator';

@Controller('quincaillerie/depots')
@UseGuards(SectorPermissionGuard, PermissionsGuard)
export class DepotController {
  constructor(private readonly depotService: DepotService) {}

  @Get()
  findAll(@Request() req) {
    return this.depotService.findAll(req.user.tenantId);
  }

  @Post()
  @RequirePermissions('stock:write')
  create(@Request() req, @Body() dto: CreateDepotDto) {
    return this.depotService.create(req.user.tenantId, dto);
  }

  @Put(':id')
  @RequirePermissions('stock:write')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateDepotDto) {
    return this.depotService.update(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('stock:write')
  remove(@Request() req, @Param('id') id: string) {
    return this.depotService.remove(req.user.tenantId, id);
  }
}
