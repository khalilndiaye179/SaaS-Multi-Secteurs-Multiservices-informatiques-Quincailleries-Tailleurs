import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum MovementTypeDto {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export class CreateStockItemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  sku: string;

  @IsNotEmpty()
  @IsString()
  unit: string;

  @IsNumber()
  purchasePrice: number;

  @IsNumber()
  sellingPrice: number;

  @IsNumber()
  quantity: number;

  @IsNumber()
  alertThreshold: number;
}

export class UpdateStockItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @IsOptional()
  @IsNumber()
  sellingPrice?: number;

  @IsOptional()
  @IsNumber()
  alertThreshold?: number;
}

export class RecordMovementDto {
  @IsEnum(MovementTypeDto)
  type: MovementTypeDto;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class SaleLineDto {
  @IsNotEmpty()
  @IsString()
  stockItemId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  sellingPrice: number;
}

export class DirectSaleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleLineDto)
  lines: SaleLineDto[];

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsBoolean()
  generateInvoice?: boolean;
}
