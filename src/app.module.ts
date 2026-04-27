import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { EquipmentStatusesModule } from './modules/equipment-statuses/equipment-statuses.module';
import { EquipmentTypesModule } from './modules/equipment-types/equipment-types.module';
import { InventoryRecordsModule } from './modules/inventory-records/inventory-records.module';
import { InventoriesModule } from './modules/inventories/inventories.module';
import { LocationsModule } from './modules/locations/locations.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    EquipmentModule,
    EquipmentStatusesModule,
    EquipmentTypesModule,
    InventoryRecordsModule,
    InventoriesModule,
    LocationsModule,
    ReportsModule,
  ],
})
export class AppModule {}
