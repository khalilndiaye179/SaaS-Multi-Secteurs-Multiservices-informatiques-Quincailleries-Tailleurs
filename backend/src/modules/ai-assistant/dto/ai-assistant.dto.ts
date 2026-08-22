import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class AiInventoryAuditDto {
  @IsOptional()
  @IsString()
  sectorType?: string;

  @IsOptional()
  @IsArray()
  stockItemIds?: string[];
}

export class AiChatPromptDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  @IsString()
  sectorType?: string;
}

export class AiAutoReorderDto {
  @IsOptional()
  @IsString()
  supplierName?: string;
}
