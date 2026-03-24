import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoriesService } from './inventories.service';
import { InventoriesController } from './inventories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory])],
  providers: [InventoriesService],
  controllers: [InventoriesController],
  exports: [InventoriesService],
})
export class InventoriesModule {}
