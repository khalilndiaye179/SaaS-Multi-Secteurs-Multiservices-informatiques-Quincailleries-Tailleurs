import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateCollaboratorDto {
  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsString()
  phone: string;

  @IsString()
  password: string;

  @IsEnum(['SUPER_ADMIN', 'FINANCE', 'SUPPORT', 'TECHNIQUE'])
  roleName: string;
}

export class AcceptInvitationDto {
  @IsString()
  token: string;

  @IsString()
  fullName: string;

  @IsString()
  password: string;

  @IsString()
  phone: string;
}

export class UpdateCollaboratorRoleDto {
  @IsEnum(['SUPER_ADMIN', 'FINANCE', 'SUPPORT', 'TECHNIQUE'])
  roleName: string;
}
