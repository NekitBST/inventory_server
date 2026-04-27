import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportHistoryResponseDto {
  @ApiProperty({ example: 'b5f3a1c3-0c18-4db6-b6ce-2a3ab4c09d9e' })
  id: string;

  @ApiProperty({ example: 'b5f3a1c3-0c18-4db6-b6ce-2a3ab4c09d9e' })
  createdBy: string;

  @ApiProperty({ enum: ['equipment', 'inventory-records'] })
  reportType: 'equipment' | 'inventory-records';

  @ApiProperty({ example: 'Отчет об оборудовании' })
  title: string;

  @ApiProperty({ enum: ['csv', 'xlsx'] })
  format: 'csv' | 'xlsx';

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  snapshot: Record<string, unknown>;

  @ApiProperty({ example: false })
  isPinned: boolean;

  @ApiProperty({ example: '2026-04-27T10:15:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-27T10:15:00.000Z' })
  updatedAt: Date;
}
