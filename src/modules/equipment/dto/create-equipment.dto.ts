import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEquipmentDto {
  @Transform(({ value }) => (value as string).trim())
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  inventoryNumber: string;

  @Transform(({ value }) => (value as string).trim())
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serialNumber?: string;

  @IsOptional()
  @IsInt()
  locationId?: number;

  @IsInt()
  statusId: number;

  @IsInt()
  typeId: number;
}
