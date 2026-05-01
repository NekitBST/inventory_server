import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const migrationsDirectory = join(__dirname, '../../migrations');
const migrationFiles = readdirSync(migrationsDirectory)
  .filter((file) => file.endsWith('.js'))
  .map((file) => join(migrationsDirectory, file));

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT as string, 10),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  entities: [__dirname + '/../modules/**/entities/*.entity.js'],
  migrations: migrationFiles,
  synchronize: false,
  logging: true,
});
