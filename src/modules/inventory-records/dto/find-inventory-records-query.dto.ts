import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FindInventoryRecordsQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;

  @ApiPropertyOptional({ enum: ['FOUND', 'DAMAGED'] })
  @IsOptional()
  @IsIn(['FOUND', 'DAMAGED'])
  resultStatus?: 'FOUND' | 'DAMAGED';

  @ApiPropertyOptional({
    example: 'Lenovo',
    description: 'Поиск по названию оборудования',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
