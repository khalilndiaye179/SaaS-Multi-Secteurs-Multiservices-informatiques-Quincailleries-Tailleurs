import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { SmsProviderService, CreateSmsConfigDto } from './sms-provider.service';
import { SmsOtpService } from './sms-otp.service';
import { SuperAdminGuard } from '../../core/guards/super-admin.guard';
import { Public } from '../../core/auth/public.decorator';

@Controller('super-admin/sms-providers')
export class SmsProviderController {
  constructor(
    private providerService: SmsProviderService,
    private otpService: SmsOtpService,
  ) {}

  @Get()
  @UseGuards(SuperAdminGuard)
  async listProviders() {
    return this.providerService.findAll();
  }

  @Get(':provider')
  @UseGuards(SuperAdminGuard)
  async getProvider(@Param('provider') provider: string) {
    return this.providerService.findOne(provider);
  }

  @Post()
  @UseGuards(SuperAdminGuard)
  async upsertProvider(@Body() dto: CreateSmsConfigDto) {
    return this.providerService.upsertConfig(dto);
  }

  @Put(':provider/toggle')
  @UseGuards(SuperAdminGuard)
  async toggleEnabled(
    @Param('provider') provider: string,
    @Body('enabled') enabled: boolean,
  ) {
    return this.providerService.toggleEnabled(provider, enabled);
  }

  @Post(':provider/test')
  @UseGuards(SuperAdminGuard)
  async testConnection(@Param('provider') provider: string) {
    return this.providerService.testConnection(provider);
  }

  // 🔓 Endpoints OTP publics avec protection anti-abus et réponses anti-énumération
  @Public()
  @Post('otp/send')
  async sendOtp(@Body('phone') phone: string) {
    return this.otpService.sendOtp(phone);
  }

  @Public()
  @Post('otp/verify')
  async verifyOtp(
    @Body('phone') phone: string,
    @Body('otp') otp: string,
  ) {
    return this.otpService.verifyOtp(phone, otp);
  }
}
