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

@Controller('equipment-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'USER')
export class EquipmentTypesController {
  constructor(private readonly typesService: EquipmentTypesService) {}

  @Get()
  findAll() {
    return this.typesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.typesService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateEquipmentTypeDto) {
    return this.typesService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEquipmentTypeDto,
  ) {
    return this.typesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.typesService.remove(id);
  }
}
