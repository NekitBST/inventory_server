import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEquipmentDto {
  @ApiProperty({
    example: 'INV-000123',
    description: 'Инвентарный номер',
    maxLength: 100,
  })
  @Transform(({ value }) => (value as string).trim())
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  inventoryNumber: string;

  @ApiProperty({
    example: 'Ноутбук Lenovo ThinkPad',
    description: 'Название оборудования',
    maxLength: 255,
  })
  @Transform(({ value }) => (value as string).trim())
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'SN-ABC-12345',
    description: 'Серийный номер',
    maxLength: 100,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional({ example: 2, description: 'ID локации' })
  @IsOptional()
  @IsInt()
  locationId?: number;

  @ApiProperty({ example: 1, description: 'ID статуса оборудования' })
  @IsInt()
  statusId: number;

  @ApiProperty({ example: 3, description: 'ID типа оборудования' })
  @IsInt()
  typeId: number;
}
