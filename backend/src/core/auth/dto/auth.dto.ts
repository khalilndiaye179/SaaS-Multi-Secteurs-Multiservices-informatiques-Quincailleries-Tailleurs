import { IsEnum, IsNotEmpty, IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { SectorType } from '../../types/tenant.types';
import { IsSenegalPhone, normalizeSenegalPhone } from '../../../common/utils/phone.util';

export class RegisterDto {
  @IsEnum(SectorType)
  @IsNotEmpty()
  sectorType: SectorType;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  managerName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsSenegalPhone()
  @Transform(({ value }) => normalizeSenegalPhone(value))
  phone: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  identifier: string; // email ou username ({CODE_TENANT}-{SEQUENCE})

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterConfirmDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}
