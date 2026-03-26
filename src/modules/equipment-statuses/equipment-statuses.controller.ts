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
import { EquipmentStatusesService } from './equipment-statuses.service';
import { CreateEquipmentStatusDto } from './dto/create-equipment-status.dto';
import { UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/constants/roles';
import { EquipmentStatus } from './entities/equipment-status.entity';

@ApiTags('Equipment Statuses')
@ApiBearerAuth()
@Controller('equipment-statuses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'USER')
export class EquipmentStatusesController {
  constructor(private readonly statusesService: EquipmentStatusesService) {}

  @ApiOperation({ summary: 'Список статусов оборудования' })
  @ApiOkResponse({ type: EquipmentStatus, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @Get()
  findAll() {
    return this.statusesService.findAll();
  }

  @ApiOperation({ summary: 'Статус оборудования по ID' })
  @ApiParam({ name: 'id', example: 1, description: 'ID статуса' })
  @ApiOkResponse({ type: EquipmentStatus })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiNotFoundResponse({ description: 'Статус оборудования не найден' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.statusesService.findById(id);
  }

  @ApiOperation({ summary: 'Создать статус оборудования' })
  @ApiCreatedResponse({ type: EquipmentStatus })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiConflictResponse({ description: 'Статус с таким именем уже существует' })
  @Post()
  create(@Body() dto: CreateEquipmentStatusDto) {
    return this.statusesService.create(dto);
  }

  @ApiOperation({ summary: 'Обновить статус оборудования' })
  @ApiParam({ name: 'id', example: 1, description: 'ID статуса' })
  @ApiOkResponse({ type: EquipmentStatus })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiNotFoundResponse({ description: 'Статус оборудования не найден' })
  @ApiConflictResponse({ description: 'Статус с таким именем уже существует' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEquipmentStatusDto,
  ) {
    return this.statusesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Удалить статус оборудования' })
  @ApiParam({ name: 'id', example: 1, description: 'ID статуса' })
  @ApiNoContentResponse({ description: 'Статус оборудования удален' })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiNotFoundResponse({ description: 'Статус оборудования не найден' })
  @ApiConflictResponse({ description: 'Нельзя удалить статус, который используется оборудованием' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.statusesService.remove(id);
  }
}
