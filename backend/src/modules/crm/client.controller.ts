import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ClientService } from './client.service';
import { PermissionsGuard } from '../../core/guards/permissions.guard';

@Controller('crm/clients')
@UseGuards(PermissionsGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  create(@Request() req, @Body() data: any) {
    return this.clientService.create(req.user.tenantId, data);
  }

  @Get()
  findAll(@Request() req) {
    return this.clientService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.clientService.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.clientService.update(req.user.tenantId, id, data);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.clientService.remove(req.user.tenantId, id);
  }
}
