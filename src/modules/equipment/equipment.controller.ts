import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { FindEquipmentQueryDto } from './dto/find-equipment-query.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/constants/roles';
import { EquipmentListResponseDto } from './dto/equipment-list-response.dto';
import { EquipmentWithRelationsResponseDto } from './dto/equipment-with-relations-response.dto';
import { EquipmentFlatResponseDto } from './dto/equipment-flat-response.dto';

@ApiTags('Equipment')
@ApiBearerAuth()
@Controller('equipment')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'USER')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @ApiOperation({ summary: 'Список оборудования с фильтрацией и пагинацией' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'statusId', required: false, example: 1 })
  @ApiQuery({ name: 'typeId', required: false, example: 3 })
  @ApiQuery({ name: 'locationId', required: false, example: 2 })
  @ApiQuery({ name: 'search', required: false, example: 'lenovo' })
  @ApiOkResponse({ type: EquipmentListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @Get()
  findAll(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    query: FindEquipmentQueryDto,
  ) {
    return this.equipmentService.findAll(query);
  }

  @ApiOperation({ summary: 'Оборудование по инвентарному номеру' })
  @ApiParam({
    name: 'inventoryNumber',
    example: 'INV-000123',
    description: 'Инвентарный номер оборудования',
  })
  @ApiOkResponse({ type: EquipmentWithRelationsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiNotFoundResponse({ description: 'Оборудование не найдено' })
  @Get('by-inventory/:inventoryNumber')
  findByInventoryNumber(@Param('inventoryNumber') inventoryNumber: string) {
    return this.equipmentService.findByInventoryNumber(inventoryNumber);
  }

  @ApiOperation({ summary: 'Оборудование по UUID' })
  @ApiParam({
    name: 'id',
    example: '10a5f06f-c4d8-4f42-9f35-97bc5b1f68aa',
    description: 'UUID оборудования',
  })
  @ApiOkResponse({ type: EquipmentWithRelationsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiNotFoundResponse({ description: 'Оборудование не найдено' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.equipmentService.findById(id);
  }

  @ApiOperation({ summary: 'Создать оборудование' })
  @ApiCreatedResponse({ type: EquipmentFlatResponseDto })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiConflictResponse({ description: 'Оборудование с таким инвентарным или серийным номером уже существует' })
  @Post()
  create(@Body() dto: CreateEquipmentDto) {
    return this.equipmentService.create(dto);
  }

  @ApiOperation({ summary: 'Обновить оборудование' })
  @ApiParam({
    name: 'id',
    example: '10a5f06f-c4d8-4f42-9f35-97bc5b1f68aa',
    description: 'UUID оборудования',
  })
  @ApiOkResponse({ type: EquipmentFlatResponseDto })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiNotFoundResponse({ description: 'Оборудование не найдено' })
  @ApiConflictResponse({ description: 'Оборудование с таким инвентарным или серийным номером уже существует' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEquipmentDto,
  ) {
    return this.equipmentService.update(id, dto);
  }

  @ApiOperation({ summary: 'Удалить оборудование' })
  @ApiParam({
    name: 'id',
    example: '10a5f06f-c4d8-4f42-9f35-97bc5b1f68aa',
    description: 'UUID оборудования',
  })
  @ApiNoContentResponse({ description: 'Оборудование удалено' })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiNotFoundResponse({ description: 'Оборудование не найдено' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.equipmentService.remove(id);
  }
}
