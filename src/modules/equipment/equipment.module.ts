import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipment } from './entities/equipment.entity';
import { EquipmentService } from './equipment.service';
import { EquipmentController } from './equipment.controller';
import { Location } from '../locations/entities/location.entity';
import { EquipmentStatus } from '../equipment-statuses/entities/equipment-status.entity';
import { EquipmentType } from '../equipment-types/entities/equipment-type.entity';
import { Inventory } from '../inventories/entities/inventory.entity';
import { InventoryRecord } from '../inventory-records/entities/inventory-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Equipment,
      Location,
      EquipmentStatus,
      EquipmentType,
      Inventory,
      InventoryRecord,
    ]),
  ],
  providers: [EquipmentService],
  controllers: [EquipmentController],
})
export class EquipmentModule {}
