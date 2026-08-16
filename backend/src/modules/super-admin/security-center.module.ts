import { Module } from '@nestjs/common';
import { SecurityCenterService } from './security-center.service';
import { SecurityCenterController } from './security-center.controller';

@Module({
  providers: [SecurityCenterService],
  controllers: [SecurityCenterController],
  exports: [SecurityCenterService],
})
export class SecurityCenterModule {}
