import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { EquipmentStatusesModule } from './modules/equipment-statuses/equipment-statuses.module';
import { EquipmentTypesModule } from './modules/equipment-types/equipment-types.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    EquipmentStatusesModule,
    EquipmentTypesModule,
  ],
})
export class AppModule {}
