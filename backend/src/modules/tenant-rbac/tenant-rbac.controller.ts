import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TenantRbacService } from './tenant-rbac.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/tenant-rbac.dto';
import { RequirePermissions } from '../../core/guards/require-permissions.decorator';
import { PermissionsGuard } from '../../core/guards/permissions.guard';

@Controller('tenant/rbac')
@UseGuards(PermissionsGuard)
export class TenantRbacController {
  constructor(private readonly rbacService: TenantRbacService) {}

  @Get('permissions')
  @RequirePermissions('settings:read')
  async getPermissions() {
    return this.rbacService.getAvailablePermissions();
  }

  @Get('roles')
  @RequirePermissions('settings:read')
  async getRoles() {
    return this.rbacService.getRoles();
  }

  @Post('roles')
  @RequirePermissions('settings:write')
  async createRole(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(dto);
  }

  @Put('roles/:id')
  @RequirePermissions('settings:write')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rbacService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @RequirePermissions('settings:write')
  async deleteRole(@Param('id') id: string) {
    return this.rbacService.deleteRole(id);
  }
}
