import { Module } from '@nestjs/common';
import { TenantRbacController } from './tenant-rbac.controller';
import { TenantRbacService } from './tenant-rbac.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TenantRbacController],
  providers: [TenantRbacService],
  exports: [TenantRbacService]
})
export class TenantRbacModule {}
