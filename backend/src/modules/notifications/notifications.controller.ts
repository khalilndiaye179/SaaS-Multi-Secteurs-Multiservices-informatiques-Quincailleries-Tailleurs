import { Controller, Get, Post, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  // Super Admin — liste des notifications globales
  @Get('super-admin')
  async getForSuperAdmin() {
    return this.notifService.getForSuperAdmin();
  }

  // Super Admin — compteur non-lus
  @Get('super-admin/unread-count')
  async getUnreadCountSuperAdmin() {
    const count = await this.notifService.getUnreadCountSuperAdmin();
    return { count };
  }

  // Tenant — liste des notifications du tenant connecté
  @Get('tenant')
  async getForTenant() {
    const tenantId = TenantContextService.getTenantId();
    if (!tenantId) return [];
    return this.notifService.getForTenant(tenantId);
  }

  // Tenant — compteur non-lus
  @Get('tenant/unread-count')
  async getUnreadCountTenant() {
    const tenantId = TenantContextService.getTenantId();
    if (!tenantId) return { count: 0 };
    const count = await this.notifService.getUnreadCountTenant(tenantId);
    return { count };
  }

  // Marquer une notif comme lue
  @Post(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notifService.markAsRead(id);
  }

  // Marquer tout lu — Super Admin
  @Post('super-admin/read-all')
  async markAllAsReadSuperAdmin() {
    return this.notifService.markAllAsReadSuperAdmin();
  }

  // Marquer tout lu — Tenant
  @Post('tenant/read-all')
  async markAllAsReadTenant() {
    const tenantId = TenantContextService.getTenantId();
    if (!tenantId) return;
    return this.notifService.markAllAsReadTenant(tenantId);
  }
}

