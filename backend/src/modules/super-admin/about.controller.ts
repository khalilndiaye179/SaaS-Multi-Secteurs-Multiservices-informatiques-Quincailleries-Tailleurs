import { Controller, Get, UseGuards } from '@nestjs/common';
import { AboutService } from './about.service';
import { SuperAdminGuard } from '../../core/guards/super-admin.guard';

@Controller('super-admin/about')
@UseGuards(SuperAdminGuard)
export class AboutController {
  constructor(private aboutService: AboutService) {}

  @Get()
  async getAbout() {
    return this.aboutService.getAboutInfo();
  }
}
