import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInventoryRecordDto {
  @ApiPropertyOptional({
    example: 'Отличное состояние, все работает',
    maxLength: 2000,
    description: 'Комментарий (по желанию)',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @ApiPropertyOptional({
    enum: ['FOUND', 'DAMAGED'],
    description: 'Статус результата сканирования',
  })
  @IsOptional()
  @IsString()
  @IsIn(['FOUND', 'DAMAGED'])
  resultStatus?: 'FOUND' | 'DAMAGED';
}
