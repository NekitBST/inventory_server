import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInventoryRecordDto {
  @IsUUID()
  inventoryId: string;

  @IsUUID()
  equipmentId: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  comment?: string;
}
