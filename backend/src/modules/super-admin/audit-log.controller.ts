import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { SuperAdminGuard } from '../../core/guards/super-admin.guard';

@Controller('super-admin/audit')
@UseGuards(SuperAdminGuard)
export class AuditLogController {
  constructor(private auditLogService: AuditLogService) {}

  @Get()
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
