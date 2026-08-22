import { Module } from '@nestjs/common';
import { SmsProviderRegistry } from './sms-provider.registry';
import { SmsProviderService } from './sms-provider.service';
import { SmsOtpService } from './sms-otp.service';
import { SmsProviderController } from './sms-provider.controller';

@Module({
  providers: [SmsProviderRegistry, SmsProviderService, SmsOtpService],
  controllers: [SmsProviderController],
  exports: [SmsProviderRegistry, SmsProviderService, SmsOtpService],
})
export class SmsProviderModule {}
