import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsEnum } from 'class-validator';

export enum TicketStatusDto {
  RECEIVED = 'RECEIVED',
  DIAGNOSIS = 'DIAGNOSIS',
  IN_REPAIR = 'IN_REPAIR',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
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
}
