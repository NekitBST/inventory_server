import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EquipmentTypesService } from './equipment-types.service';
import { CreateEquipmentTypeDto } from './dto/create-equipment-type.dto';
import { UpdateEquipmentTypeDto } from './dto/update-equipment-type.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/constants/roles';
import { EquipmentType } from './entities/equipment-type.entity';

@ApiTags('Equipment Types')
@ApiBearerAuth()
@Controller('equipment-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'USER')
export class EquipmentTypesController {
  constructor(private readonly typesService: EquipmentTypesService) {}

  @ApiOperation({ summary: 'Список типов оборудования' })
  @ApiOkResponse({ type: EquipmentType, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @Get()
  findAll() {
    return this.typesService.findAll();
  }

  @ApiOperation({ summary: 'Тип оборудования по ID' })
  @ApiParam({ name: 'id', example: 1, description: 'ID типа оборудования' })
  @ApiOkResponse({ type: EquipmentType })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiNotFoundResponse({ description: 'Тип оборудования не найден' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.typesService.findById(id);
  }

  @ApiOperation({ summary: 'Создать тип оборудования' })
  @ApiCreatedResponse({ type: EquipmentType })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiConflictResponse({ description: 'Тип оборудования с таким названием уже существует' })
  @Post()
  create(@Body() dto: CreateEquipmentTypeDto) {
    return this.typesService.create(dto);
  }

  @ApiOperation({ summary: 'Обновить тип оборудования' })
  @ApiParam({ name: 'id', example: 1, description: 'ID типа оборудования' })
  @ApiOkResponse({ type: EquipmentType })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiNotFoundResponse({ description: 'Тип оборудования не найден' })
  @ApiConflictResponse({ description: 'Тип оборудования с таким названием уже существует' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEquipmentTypeDto,
  ) {
    return this.typesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Удалить тип оборудования' })
  @ApiParam({ name: 'id', example: 1, description: 'ID типа оборудования' })
  @ApiNoContentResponse({ description: 'Тип оборудования удален' })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiNotFoundResponse({ description: 'Тип оборудования не найден' })
  @ApiConflictResponse({ description: 'Нельзя удалить тип оборудования, который используется оборудованием' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.typesService.remove(id);
  }
}
