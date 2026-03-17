import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentType } from './entities/equipment-type.entity';
import { EquipmentTypesService } from './equipment-types.service';
import { EquipmentTypesController } from './equipment-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EquipmentType])],
  providers: [EquipmentTypesService],
  controllers: [EquipmentTypesController],
})
export class EquipmentTypesModule {}
