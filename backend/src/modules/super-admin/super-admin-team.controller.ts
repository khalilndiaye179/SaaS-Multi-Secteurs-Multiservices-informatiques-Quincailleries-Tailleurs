import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { SuperAdminTeamService } from './super-admin-team.service';
import { CreateCollaboratorDto, UpdateCollaboratorRoleDto } from './dto/super-admin-team.dto';
import { SuperAdminGuard } from '../../core/guards/super-admin.guard';

@Controller('super-admin/team')
export class SuperAdminTeamController {
  constructor(private teamService: SuperAdminTeamService) {}

  @Get()
  @UseGuards(SuperAdminGuard)
  async getTeam() {
    return this.teamService.getTeamOverview();
  }

  @Post('collaborators')
  @UseGuards(SuperAdminGuard)
  async createCollaborator(@Body() dto: CreateCollaboratorDto) {
    return this.teamService.createCollaborator(dto);
  }

  @Patch(':userId/role')
  @UseGuards(SuperAdminGuard)
  async updateRole(
    @Param('userId') userId: string,
    @Body() dto: UpdateCollaboratorRoleDto,
  ) {
    return this.teamService.updateRole(userId, dto);
  }

  @Patch(':userId/status')
  @UseGuards(SuperAdminGuard)
  async toggleStatus(
    @Param('userId') userId: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.teamService.toggleStatus(userId, isActive);
  }

  @Post(':userId/reset-password')
  @UseGuards(SuperAdminGuard)
  async resetPassword(@Param('userId') userId: string) {
    return this.teamService.forceResetPassword(userId);
  }

  @Post(':userId/disable-2fa')
  @UseGuards(SuperAdminGuard)
  async disable2fa(@Param('userId') userId: string) {
    return this.teamService.disable2fa(userId);
  }
}
