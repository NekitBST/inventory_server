import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import type { ReportType } from '../entities/report-history.entity';

export class FindReportHistoryQueryDto {
  @ApiPropertyOptional({ enum: ['equipment', 'inventory-records'] })
  @IsOptional()
  @IsIn(['equipment', 'inventory-records'])
  reportType?: ReportType;
}
