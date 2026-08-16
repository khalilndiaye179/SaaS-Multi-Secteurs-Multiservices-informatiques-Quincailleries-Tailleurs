import { IsOptional, IsString, IsInt, Min, Max, IsEnum, IsNumber } from 'class-validator';

export class SuperAdminBillingFilterDto {
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
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsEnum(['createdAt', 'amount', 'totalAmount', 'status', 'number', 'quoteNumber'])
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class UpdatePricingConfigDto {
  @IsNumber()
  @Min(0)
  baseMonthlyPrice: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  discount6Months: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  discount12Months: number;

  @IsString()
  currency: string;
}
