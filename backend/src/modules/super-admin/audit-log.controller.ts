import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { PermissionGuard } from '../../core/auth/guards/permission.guard';
import { RequirePermission } from '../../core/auth/decorators/require-permission.decorator';

@Controller('super-admin/audit')
@UseGuards(PermissionGuard)
export class AuditLogController {
  constructor(private auditLogService: AuditLogService) {}

  @Get()
  @RequirePermission('admin:logs:read')
  async getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('tenantId') tenantId?: string,
    @Query('actorUserId') actorUserId?: string,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
  ) {
    return this.auditLogService.find({
      page,
      limit,
      tenantId,
      actorUserId,
      action,
      resourceType,
    });
  }
}
