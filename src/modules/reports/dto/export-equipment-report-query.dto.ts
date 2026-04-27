import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ExportEquipmentReportQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Фильтр по ID статуса' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  statusId?: number;

  @ApiPropertyOptional({ example: 3, description: 'Фильтр по ID типа' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  typeId?: number;

  @ApiPropertyOptional({ example: 2, description: 'Фильтр по ID локации' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  locationId?: number;

  @ApiPropertyOptional({
    example: 'lenovo',
    description: 'Поиск по инвентарному номеру, названию или серийному номеру',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  search?: string;
}
