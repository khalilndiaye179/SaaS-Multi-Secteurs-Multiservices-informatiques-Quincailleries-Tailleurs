import { Controller, Get, UseGuards } from '@nestjs/common';
import { AboutService } from './about.service';
import { PermissionGuard } from '../../core/auth/guards/permission.guard';
import { RequirePermission } from '../../core/auth/decorators/require-permission.decorator';

@Controller('super-admin/about')
@UseGuards(PermissionGuard)
export class AboutController {
  constructor(private aboutService: AboutService) {}

  @Get()
  async getAbout() {
    return this.aboutService.getAboutInfo();
  }
}
