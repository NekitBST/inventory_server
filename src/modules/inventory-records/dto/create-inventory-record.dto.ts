import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryRecordDto {
  @ApiProperty({
    example: '5b8f0b5f-a8f9-4cdb-a9d3-8d3137d8ce74',
    description: 'UUID инвентаризации',
  })
  @IsUUID()
  inventoryId: string;

  @ApiProperty({
    example: '10a5f06f-c4d8-4f42-9f35-97bc5b1f68aa',
    description: 'UUID оборудования',
  })
  @IsUUID()
  equipmentId: string;

  @ApiPropertyOptional({
    example: 'Отличное состояние, все работает',
    description: 'Комментарий (по желанию)',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  comment?: string;
}
