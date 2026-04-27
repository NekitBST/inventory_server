import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ExportInventoryRecordsReportQueryDto {
  @ApiPropertyOptional({ enum: ['FOUND', 'DAMAGED'] })
  @IsOptional()
  @IsIn(['FOUND', 'DAMAGED'])
  resultStatus?: 'FOUND' | 'DAMAGED';

  @ApiPropertyOptional({
    example: 'Lenovo',
    description: 'Поиск по инвентарному номеру или названию оборудования',
  })
  @IsOptional()
  @Type(() => String)
  @IsString()
  search?: string;
}
