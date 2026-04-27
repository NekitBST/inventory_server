import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/constants/roles';
import { ReportsService } from './reports.service';
import { ExportEquipmentReportQueryDto } from './dto/export-equipment-report-query.dto';
import { ExportInventoryRecordsReportQueryDto } from './dto/export-inventory-records-report-query.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'USER')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Экспорт CSV отчета по оборудованию' })
  @ApiProduces('text/csv')
  @ApiOkResponse({ description: 'CSV файл отчета по оборудованию' })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @Get('equipment/export')
  async exportEquipment(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    query: ExportEquipmentReportQueryDto,
    @Res() response: Response,
  ) {
    const csv = await this.reportsService.buildEquipmentCsv(query);
    const fileName = `equipment_report_${new Date().toISOString().slice(0, 10)}.csv`;

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`,
    );
    response.send(csv);
  }

  @ApiOperation({ summary: 'Экспорт CSV отчета по выбранной инвентаризации' })
  @ApiProduces('text/csv')
  @ApiParam({
    name: 'inventoryId',
    example: '5b8f0b5f-a8f9-4cdb-a9d3-8d3137d8ce74',
    description: 'UUID инвентаризации',
  })
  @ApiOkResponse({ description: 'CSV файл отчета по инвентаризации' })
  @ApiNotFoundResponse({ description: 'Инвентаризация не найдена' })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @Get('inventories/:inventoryId/export')
  async exportInventoryRecords(
    @Param('inventoryId', ParseUUIDPipe) inventoryId: string,
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    query: ExportInventoryRecordsReportQueryDto,
    @Res() response: Response,
  ) {
    const csv = await this.reportsService.buildInventoryRecordsCsv(
      inventoryId,
      query,
    );
    const fileName = `inventory_${inventoryId.slice(0, 8)}_report_${new Date().toISOString().slice(0, 10)}.csv`;

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`,
    );
    response.send(csv);
  }
}
