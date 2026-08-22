import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RegisterConfirmDto } from './dto/auth.dto';
import { Public } from './public.decorator';

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
}

