import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';

export class SuperAdminAnalyticsFilterDto {
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsEnum(['QUINCAILLERIE', 'MULTISERVICES_IT', 'TAILLEUR'])
  sectorType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
