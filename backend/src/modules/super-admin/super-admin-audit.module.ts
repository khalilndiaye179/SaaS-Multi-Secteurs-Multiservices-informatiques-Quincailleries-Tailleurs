import { Module, Global } from '@nestjs/common';
import { EncryptionService } from '../../core/security/encryption.service';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';

@Global()
@Module({
  providers: [EncryptionService, AuditLogService],
  controllers: [AuditLogController],
  exports: [EncryptionService, AuditLogService],
})
export class SuperAdminAuditModule {}
