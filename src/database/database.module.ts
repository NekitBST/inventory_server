import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        database: config.get<string>('database.name'),
        username: config.get<string>('database.user'),
        password: config.get<string>('database.password'),
        entities: [__dirname + '/../modules/**/entities/*.entity.{ts,js}'],
        migrations: [__dirname + '/../../migrations/*.{ts,js}'],
        synchronize: false,
        migrationsRun: false,
        logging: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
