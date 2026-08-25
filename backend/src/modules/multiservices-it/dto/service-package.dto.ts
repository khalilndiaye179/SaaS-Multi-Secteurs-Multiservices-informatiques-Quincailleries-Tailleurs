import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsEnum, IsBoolean } from 'class-validator';

export enum ServicePackageCategoryDto {
  MAINTENANCE = 'MAINTENANCE',
  SYSTEM = 'SYSTEM',
  HARDWARE = 'HARDWARE',
  NETWORK = 'NETWORK',
}

export class CreateServicePackageDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  estimatedHours: string;

  @IsNumber()
  @Min(0)
  priceXOF: number;

  @IsEnum(ServicePackageCategoryDto)
  category: ServicePackageCategoryDto;
}

export class UpdateServicePackageDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  estimatedHours?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceXOF?: number;

  @IsOptional()
  @IsEnum(ServicePackageCategoryDto)
  category?: ServicePackageCategoryDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
