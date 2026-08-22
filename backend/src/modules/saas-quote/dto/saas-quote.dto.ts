import { IsString, IsEmail, IsOptional, IsInt, IsNumber, Min, IsEnum } from 'class-validator';

export class CreateSaaSQuoteDto {
  @IsString()
  clientName: string;

  @IsEmail()
  clientEmail: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  planName?: string;

  @IsInt()
  @Min(1)
  durationMonths: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  customDiscount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  customTax?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  validityDays?: number;
}

export class UpdateSaaSQuoteDto {
  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsString()
  planName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMonths?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  customDiscount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CANCELLED'])
  status?: string;
}
