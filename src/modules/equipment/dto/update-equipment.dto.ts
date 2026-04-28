import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateEquipmentDto {
  @ApiPropertyOptional({
    example: 'INV-000123',
    description: 'Новый инвентарный номер',
    maxLength: 100,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  inventoryNumber?: string;

  @ApiPropertyOptional({
    example: 'Ноутбук Lenovo ThinkPad',
    description: 'Новое название оборудования',
    maxLength: 255,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    example: 'SN-ABC-12345',
    description: 'Новый серийный номер',
    maxLength: 100,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional({
    example: 2,
    nullable: true,
    description: 'Новый ID локации (null чтобы снять локацию)',
  })
  @IsOptional()
  @IsInt()
  locationId?: number | null;

  @ApiPropertyOptional({ example: 1, description: 'Новый ID статуса' })
  @IsOptional()
  @IsInt()
  statusId?: number;

  @ApiPropertyOptional({ example: 3, description: 'Новый ID типа' })
  @IsOptional()
  @IsInt()
  typeId?: number;
}
