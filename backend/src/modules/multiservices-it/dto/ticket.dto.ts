import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsEnum, ValidateNested, IsArray } from 'class-validator';

export enum TicketStatusDto {
  RECEIVED = 'RECEIVED',
  DIAGNOSIS = 'DIAGNOSIS',
  IN_REPAIR = 'IN_REPAIR',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  IMPOSSIBLE = 'IMPOSSIBLE',
  CANCELLED = 'CANCELLED',
  CONVERTED_TO_STOCK = 'CONVERTED_TO_STOCK',
}

export class RepairPartDto {
  @IsString()
  @IsNotEmpty()
  stockItemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsString()
  @IsNotEmpty()
  clientPhone: string;

  @IsString()
  @IsNotEmpty()
  deviceModel: string;

  @IsString()
  @IsNotEmpty()
  issueDesc: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatusDto)
  status: TicketStatusDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  finalCost?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  photoBefore?: string;

  @IsOptional()
  @IsString()
  photoAfter?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RepairPartDto)
  usedParts?: RepairPartDto[];
}

export class ConvertToStockDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @IsString()
  @IsNotEmpty()
  unit: string;
}
