import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsObject, IsOptional } from 'class-validator';
import type {
  ReportFormat,
  ReportType,
} from '../entities/report-history.entity';

export class CreateReportHistoryDto {
  @ApiProperty({ enum: ['equipment', 'inventory-records'] })
  @IsIn(['equipment', 'inventory-records'])
  reportType: ReportType;

  @ApiProperty({ enum: ['csv', 'xlsx'] })
  @IsIn(['csv', 'xlsx'])
  format: ReportFormat;

  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  snapshot: Record<string, unknown>;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
