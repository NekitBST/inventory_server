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
  ApiConflictResponse,
  ApiNotFoundResponse
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
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/constants/roles';
import { Location } from './entities/location.entity';
import { FindLocationsQueryDto } from './dto/find-locations-query.dto';
import { LocationListResponseDto } from './dto/location-list-response.dto';

@ApiTags('Locations')
@ApiBearerAuth()
@Controller('locations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'USER')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @ApiOperation({ summary: 'Список локаций' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'Кабинет' })
  @ApiOkResponse({ type: LocationListResponseDto })
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
    query: FindLocationsQueryDto,
  ) {
    return this.locationsService.findAll(query);
  }

  @ApiOperation({ summary: 'Локация по ID' })
  @ApiParam({ name: 'id', example: 1, description: 'ID локации' })
  @ApiOkResponse({ type: Location })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiNotFoundResponse({ description: 'Локация не найдена' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.findById(id);
  }

  @ApiOperation({ summary: 'Создать локацию' })
  @ApiCreatedResponse({ type: Location })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiConflictResponse({ description: 'Локация с таким названием уже существует' })
  @Post()
  create(@Body() dto: CreateLocationDto) {
    return this.locationsService.create(dto);
  }

  @ApiOperation({ summary: 'Обновить локацию' })
  @ApiParam({ name: 'id', example: 1, description: 'ID локации' })
  @ApiOkResponse({ type: Location })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiNotFoundResponse({ description: 'Локация не найдена' })
  @ApiConflictResponse({ description: 'Локация с таким названием уже существует' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Удалить локацию' })
  @ApiParam({ name: 'id', example: 1, description: 'ID локации' })
  @ApiNoContentResponse({ description: 'Локация удалена' })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiNotFoundResponse({ description: 'Локация не найдена' })
  @ApiConflictResponse({ description: 'Нельзя удалить локацию, которая используется оборудованием' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.remove(id);
  }
}
