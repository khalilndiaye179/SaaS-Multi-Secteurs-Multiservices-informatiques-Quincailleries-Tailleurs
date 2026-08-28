import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, ValidateNested, IsEmail, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class QuoteLineDto {
  @IsOptional()
  @IsString()
  stockItemId?: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  vatRate?: number;
}

export class CreateQuoteDto {
  @IsNotEmpty()
  @IsString()
  clientName: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  applyVat?: boolean;

  @IsOptional()
  @IsNumber()
  validityDuration?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteLineDto)
  lines: QuoteLineDto[];
}

export class CreateInvoiceDto extends CreateQuoteDto {
  @IsOptional()
  @IsString()
  quoteId?: string;
}
