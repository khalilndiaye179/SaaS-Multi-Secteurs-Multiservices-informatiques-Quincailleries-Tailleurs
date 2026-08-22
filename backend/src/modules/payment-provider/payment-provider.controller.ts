import { Controller, Get, Post, Put, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { PaymentProviderService, CreateProviderConfigDto } from './payment-provider.service';
import { SuperAdminGuard } from '../../core/guards/super-admin.guard';
import { Public } from '../../core/auth/public.decorator';

@Controller('super-admin/payment-providers')
export class PaymentProviderController {
  constructor(private providerService: PaymentProviderService) {}

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
  async upsertProvider(@Body() dto: CreateProviderConfigDto) {
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

  // 🔓 Point de terminaison public sécurisé pour les Webhooks externes
  @Public()
  @Post('webhooks/:provider')
  async handleWebhook(
    @Param('provider') provider: string,
    @Headers() headers: Record<string, any>,
    @Body() body: any,
  ) {
    return this.providerService.handleWebhook(provider, headers, body);
  }
}

@Controller('payment-providers')
export class TenantPaymentProviderController {
  constructor(private providerService: PaymentProviderService) {}

  @Public()
  @Get('active')
  async getActiveProviders() {
    return this.providerService.findAllActive();
  }
}
