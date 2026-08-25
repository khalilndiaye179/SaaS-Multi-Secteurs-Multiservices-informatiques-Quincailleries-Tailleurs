import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { SuperAdminTeamService } from './super-admin-team.service';
import { InviteCollaboratorDto, AcceptInvitationDto, UpdateCollaboratorRoleDto } from './dto/super-admin-team.dto';
import { SuperAdminGuard } from '../../core/guards/super-admin.guard';
import { Public } from '../../core/auth/public.decorator';

@Controller('super-admin/team')
export class SuperAdminTeamController {
  constructor(private teamService: SuperAdminTeamService) {}

  @Get()
  @UseGuards(SuperAdminGuard)
  async getTeam() {
    return this.teamService.getTeamOverview();
  }

  @Post('invitations')
  @UseGuards(SuperAdminGuard)
  async invite(@Body() dto: InviteCollaboratorDto) {
    return this.teamService.inviteCollaborator(dto);
  }

  @Post('invitations/:id/resend')
  @UseGuards(SuperAdminGuard)
  async resend(@Param('id') id: string) {
    return this.teamService.resendInvitation(id);
  }

  @Post('invitations/:id/cancel')
  @UseGuards(SuperAdminGuard)
  async cancel(@Param('id') id: string) {
    return this.teamService.cancelInvitation(id);
  }

  // 🔓 Public Secure Endpoint pour la soumission du formulaire d'invitation avec Hash SHA-256
  @Public()
  @Post('invitations/accept')
  async accept(@Body() dto: AcceptInvitationDto) {
    return this.teamService.acceptInvitation(dto);
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
