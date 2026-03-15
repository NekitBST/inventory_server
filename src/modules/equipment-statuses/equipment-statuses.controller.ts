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

@Controller('equipment-statuses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'USER')
export class EquipmentStatusesController {
  constructor(private readonly statusesService: EquipmentStatusesService) {}

  @Get()
  findAll() {
    return this.statusesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.statusesService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateEquipmentStatusDto) {
    return this.statusesService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEquipmentStatusDto,
  ) {
    return this.statusesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.statusesService.remove(id);
  }
}
