import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RegisterConfirmDto, ChangePasswordDto, EnableTotpDto, DisableTotpDto, VerifyTotpDto } from './dto/auth.dto';
import { Public } from './public.decorator';
import { TenantContextService } from '../tenant/tenant-context.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register/init')
  async registerInit(@Body() dto: RegisterDto) {
    return this.authService.registerInit(dto);
  }

  @Public()
  @Post('register/confirm')
  async registerConfirm(@Body() dto: RegisterConfirmDto) {
    return this.authService.registerConfirm(dto.email, dto.otp);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('change-password')
  async changePassword(@Body() dto: ChangePasswordDto) {
    const store = TenantContextService.getStore();
    return this.authService.changePassword(store?.userId, dto);
  }

  @Post('2fa/setup')
  async setupTotp() {
    const store = TenantContextService.getStore();
    return this.authService.setupTotp(store?.userId);
  }

  @Post('2fa/enable')
  async enableTotp(@Body() dto: EnableTotpDto) {
    const store = TenantContextService.getStore();
    return this.authService.enableTotp(store?.userId, dto);
  }

  @Post('2fa/disable')
  async disableTotp(@Body() dto: DisableTotpDto) {
    const store = TenantContextService.getStore();
    return this.authService.disableTotp(store?.userId, dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login/verify-totp')
  async verifyTotpLogin(@Body() dto: VerifyTotpDto) {
    return this.authService.verifyTotpLogin(dto);
  }
}

