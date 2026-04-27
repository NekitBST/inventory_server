import {
  Controller,
  Patch,
  Body,
  Post,
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
  ApiCreatedResponse,
  ApiBody,
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/constants/roles';
import { User } from '../users/entities/user.entity';
import { ReportsService } from './reports.service';
import { ExportEquipmentReportQueryDto } from './dto/export-equipment-report-query.dto';
import { ExportInventoryRecordsReportQueryDto } from './dto/export-inventory-records-report-query.dto';
import { CreateReportHistoryDto } from './dto/create-report-history.dto';
import { FindReportHistoryQueryDto } from './dto/find-report-history-query.dto';
import { ReportHistoryResponseDto } from './dto/report-history-response.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'USER')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'История отчетов текущего пользователя' })
  @ApiOkResponse({ type: ReportHistoryResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @Get('history')
  getHistory(
    @CurrentUser() user: User,
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    query: FindReportHistoryQueryDto,
  ) {
    return this.reportsService.findReportHistory(user, query);
  }

  @ApiOperation({ summary: 'Сохранить отчет в историю' })
  @ApiBody({ type: CreateReportHistoryDto })
  @ApiCreatedResponse({ type: ReportHistoryResponseDto })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @Post('history')
  createHistory(
    @CurrentUser() user: User,
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    dto: CreateReportHistoryDto,
  ) {
    return this.reportsService.createReportHistory(user, dto);
  }

  @ApiOperation({ summary: 'Закрепить или открепить отчет в истории' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { isPinned: { type: 'boolean' } },
      required: ['isPinned'],
    },
  })
  @ApiOkResponse({ type: ReportHistoryResponseDto })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @Patch('history/:id/pin')
  setPinned(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) historyId: string,
    @Body('isPinned') isPinned: boolean,
  ) {
    return this.reportsService.setReportHistoryPinned(
      user,
      historyId,
      isPinned,
    );
  }

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
