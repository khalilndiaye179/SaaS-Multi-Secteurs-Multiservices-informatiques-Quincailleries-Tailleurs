import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { PermissionsGuard } from '../../core/guards/permissions.guard';

@Controller('crm/suppliers')
@UseGuards(PermissionsGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  create(@Request() req, @Body() data: any) {
    return this.supplierService.create(req.user.tenantId, data);
  }

  @Get()
  findAll(@Request() req) {
    return this.supplierService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.supplierService.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.supplierService.update(req.user.tenantId, id, data);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.supplierService.remove(req.user.tenantId, id);
  }
}
