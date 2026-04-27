import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipment } from '../equipment/entities/equipment.entity';
import { Inventory } from '../inventories/entities/inventory.entity';
import { InventoryRecord } from '../inventory-records/entities/inventory-record.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([Equipment, Inventory, InventoryRecord])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
