import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { InventoriesService } from './inventories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/constants/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { InventoryResponseDto } from './dto/inventory-response.dto';
import { InventoryWithUserResponseDto } from './dto/inventory-with-user-response.dto';
import { FindInventoriesQueryDto } from './dto/find-inventories-query.dto';
import { InventoryListResponseDto } from './dto/inventory-list-response.dto';

@ApiTags('Inventories')
@ApiBearerAuth()
@Controller('inventories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'USER')
export class InventoriesController {
  constructor(private readonly inventoriesService: InventoriesService) {}

  @ApiOperation({ summary: 'Создать инвентаризацию' })
  @ApiCreatedResponse({ type: InventoryResponseDto })
  @ApiConflictResponse({
    description:
      'Сначала закройте текущую инвентаризацию перед созданием новой',
  })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @Post()
  create(@CurrentUser() user: User) {
    return this.inventoriesService.create(user.id);
  }

  @ApiOperation({ summary: 'Список инвентаризаций' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'CLOSED'] })
  @ApiQuery({ name: 'search', required: false, example: 'Иван' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiOkResponse({ type: InventoryListResponseDto })
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
    query: FindInventoriesQueryDto,
  ) {
    return this.inventoriesService.findAll(query);
  }

  @ApiOperation({ summary: 'Инвентаризация по UUID' })
  @ApiParam({
    name: 'id',
    example: '5b8f0b5f-a8f9-4cdb-a9d3-8d3137d8ce74',
    description: 'UUID инвентаризации',
  })
  @ApiOkResponse({ type: InventoryWithUserResponseDto })
  @ApiNotFoundResponse({ description: 'Инвентаризация не найдена' })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoriesService.findById(id);
  }

  @ApiOperation({ summary: 'Закрыть инвентаризацию' })
  @ApiParam({
    name: 'id',
    example: '5b8f0b5f-a8f9-4cdb-a9d3-8d3137d8ce74',
    description: 'UUID инвентаризации',
  })
  @ApiOkResponse({ type: InventoryResponseDto })
  @ApiNotFoundResponse({ description: 'Инвентаризация не найдена' })
  @ApiConflictResponse({ description: 'Инвентаризация уже закрыта' })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @Patch(':id/close')
  close(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoriesService.close(id);
  }
}
