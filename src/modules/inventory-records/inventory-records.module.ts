import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryRecord } from './entities/inventory-record.entity';
import { InventoryRecordsService } from './inventory-records.service';
import { InventoryRecordsController } from './inventory-records.controller';
import { Inventory } from '../inventories/entities/inventory.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { EquipmentAuditEvent } from '../equipment/entities/equipment-audit-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryRecord,
      Inventory,
      Equipment,
      EquipmentAuditEvent,
    ]),
  ],
  providers: [InventoryRecordsService],
  controllers: [InventoryRecordsController],
  exports: [InventoryRecordsService],
})
export class InventoryRecordsModule {}
