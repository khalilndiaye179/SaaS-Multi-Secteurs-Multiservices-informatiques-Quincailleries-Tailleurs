import { IsString, IsNotEmpty, IsObject, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';

export enum TailleurOrderStatusDto {
  ORDERED = 'ORDERED',
  CUTTING = 'CUTTING',
  SEWING = 'SEWING',
  FITTING = 'FITTING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export class CreateMeasurementDto {
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsString()
  @IsNotEmpty()
  clientPhone: string;

  @IsOptional()
  @IsString()
  beneficiaryName?: string;

  @IsString()
  @IsNotEmpty()
  garmentType: string;

  @IsOptional()
  @IsString()
  parentMeasurementId?: string;

  @IsObject()
  @IsNotEmpty()
  measurements: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMeasurementDto {
  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsString()
  beneficiaryName?: string;

  @IsOptional()
  @IsString()
  garmentType?: string;

  @IsOptional()
  @IsString()
  parentMeasurementId?: string;

  @IsOptional()
  @IsObject()
  measurements?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateTailleurOrderDto {
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsString()
  @IsNotEmpty()
  clientPhone: string;

  @IsString()
  @IsNotEmpty()
  garmentType: string;

  @IsOptional()
  @IsString()
  fabricDesc?: string;

  @IsOptional()
  @IsDateString()
  fittingDate?: string;

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @IsNumber()
  totalPrice: number;

  @IsOptional()
  @IsNumber()
  advancePaid?: number;

  @IsOptional()
  @IsString()
  measurementsId?: string;
}

export class UpdateTailleurOrderStatusDto {
  @IsEnum(TailleurOrderStatusDto)
  status: TailleurOrderStatusDto;

  @IsOptional()
  @IsNumber()
  advancePaid?: number;

  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class UpdateTailleurOrderDto {
  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsString()
  garmentType?: string;

  @IsOptional()
  @IsString()
  fabricDesc?: string;

  @IsOptional()
  @IsNumber()
  totalPrice?: number;

  @IsOptional()
  @IsNumber()
  advancePaid?: number;

  @IsOptional()
  @IsDateString()
  fittingDate?: string;

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;
}

