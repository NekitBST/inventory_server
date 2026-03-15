import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentStatus } from './entities/equipment-status.entity';
import { EquipmentStatusesService } from './equipment-statuses.service';
import { EquipmentStatusesController } from './equipment-statuses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EquipmentStatus])],
  providers: [EquipmentStatusesService],
  controllers: [EquipmentStatusesController],
})
export class EquipmentStatusesModule {}
