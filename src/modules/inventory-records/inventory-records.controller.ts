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

@Controller('inventory-records')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'USER')
export class InventoryRecordsController {
  constructor(private readonly recordsService: InventoryRecordsService) {}

  @Post()
  create(@Body() dto: CreateInventoryRecordDto) {
    return this.recordsService.create(dto);
  }

  @Get('by-inventory/:inventoryId')
  findByInventory(@Param('inventoryId', ParseUUIDPipe) inventoryId: string) {
    return this.recordsService.findByInventory(inventoryId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryRecordDto,
  ) {
    return this.recordsService.update(id, dto);
  }
}
