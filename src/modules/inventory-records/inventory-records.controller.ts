import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InventoryRecordsService } from './inventory-records.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/constants/roles';
import { CreateInventoryRecordDto } from './dto/create-inventory-record.dto';
import { UpdateInventoryRecordDto } from './dto/update-inventory-record.dto';
import { InventoryRecordResponseDto } from './dto/inventory-record-response.dto';

@ApiTags('Inventory Records')
@ApiBearerAuth()
@Controller('inventory-records')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'USER')
export class InventoryRecordsController {
  constructor(private readonly recordsService: InventoryRecordsService) {}

  @ApiOperation({ summary: 'Добавить запись сканирования в инвентаризацию' })
  @ApiCreatedResponse({ type: InventoryRecordResponseDto })
  @ApiNotFoundResponse({
    description: 'Инвентаризация не найдена или оборудование не найдено',
  })
  @ApiConflictResponse({
    description:
      'Нельзя добавлять записи в закрытую инвентаризацию или запись уже существует',
  })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @Post()
  create(@Body() dto: CreateInventoryRecordDto) {
    return this.recordsService.create(dto);
  }

  @ApiOperation({ summary: 'Список записей по инвентаризации' })
  @ApiParam({
    name: 'inventoryId',
    example: '5b8f0b5f-a8f9-4cdb-a9d3-8d3137d8ce74',
    description: 'UUID инвентаризации',
  })
  @ApiOkResponse({ type: InventoryRecordResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Инвентаризация не найдена' })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @Get('by-inventory/:inventoryId')
  findByInventory(@Param('inventoryId', ParseUUIDPipe) inventoryId: string) {
    return this.recordsService.findByInventory(inventoryId);
  }

  @ApiOperation({ summary: 'Обновить запись инвентаризации' })
  @ApiParam({
    name: 'id',
    example: '9abebc84-85be-4f83-a1ee-e7d5a18c39fb',
    description: 'UUID записи инвентаризации',
  })
  @ApiOkResponse({ type: InventoryRecordResponseDto })
  @ApiNotFoundResponse({
    description: 'Запись инвентаризации не найдена',
  })
  @ApiConflictResponse({
    description: 'Нельзя изменять записи закрытой инвентаризации',
  })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryRecordDto,
  ) {
    return this.recordsService.update(id, dto);
  }
}
