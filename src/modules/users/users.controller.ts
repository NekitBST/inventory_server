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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFlatResponseDto } from './dto/user-flat-response.dto';
import { UserWithRoleResponseDto } from './dto/user-with-role-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/constants/roles';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UserListResponseDto } from './dto/user-list-response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'Список пользователей (только для администраторов)',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'Иван' })
  @ApiQuery({ name: 'roleId', required: false, example: 2 })
  @ApiQuery({ name: 'isActive', required: false, example: true })
  @ApiOkResponse({ type: UserListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiForbiddenResponse({ description: 'Доступ запрещен' })
  @Get()
  findAll(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    query: FindUsersQueryDto,
  ) {
    return this.usersService.findAll(query);
  }

  @ApiOperation({ summary: 'Пользователь по ID (только для администраторов)' })
  @ApiOkResponse({ type: UserWithRoleResponseDto })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiForbiddenResponse({ description: 'Доступ запрещен' })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @ApiOperation({
    summary: 'Создать пользователя (только для администраторов)',
  })
  @ApiCreatedResponse({ type: UserFlatResponseDto })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiForbiddenResponse({ description: 'Доступ запрещен' })
  @ApiConflictResponse({ description: 'Email уже занят' })
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @ApiOperation({ summary: 'Обновить пользователя' })
  @ApiOkResponse({ type: UserFlatResponseDto })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiForbiddenResponse({ description: 'Доступ запрещен' })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  @ApiConflictResponse({ description: 'Email уже занят' })
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Деактивировать пользователя (только для администраторов)',
  })
  @ApiNoContentResponse({ description: 'Пользователь деактивирован' })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiForbiddenResponse({ description: 'Доступ запрещен' })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  @ApiConflictResponse({ description: 'Пользователь уже деактивирован' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }

  @ApiOperation({
    summary: 'Восстановить пользователя (только для администраторов)',
  })
  @ApiNoContentResponse({ description: 'Пользователь восстановлен' })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден' })
  @ApiForbiddenResponse({ description: 'Доступ запрещен' })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  @ApiConflictResponse({ description: 'Пользователь уже активен' })
  @Post(':id/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.restore(id);
  }
}
