import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaDb1772820697167 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_users_role_id ON users(role_id)`);

    await queryRunner.query(`
      CREATE TABLE locations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE equipment_statuses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE equipment_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE equipment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inventory_number VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        serial_number VARCHAR(100) UNIQUE,
        location_id INT REFERENCES locations(id) ON DELETE SET NULL,
        status_id INT NOT NULL REFERENCES equipment_statuses(id) ON DELETE RESTRICT,
        type_id INT NOT NULL REFERENCES equipment_types(id) ON DELETE RESTRICT,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_equipment_location ON equipment(location_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_equipment_status ON equipment(status_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_equipment_type ON equipment(type_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE inventories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        started_at TIMESTAMP NOT NULL DEFAULT now(),
        finished_at TIMESTAMP,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        CHECK (status IN ('OPEN', 'CLOSED'))
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_inventories_created_by ON inventories(created_by)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_inventories_open_per_user ON inventories(created_by) WHERE status = 'OPEN'`,
    );

    await queryRunner.query(`
      CREATE TABLE inventory_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inventory_id UUID NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
        equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
        scanned_at TIMESTAMP NOT NULL DEFAULT now(),
        comment TEXT,
        result_status VARCHAR(20) NOT NULL,
        CHECK (result_status IN ('FOUND', 'DAMAGED'))
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_inventory_records_inventory ON inventory_records(inventory_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_inventory_records_equipment ON inventory_records(equipment_id)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_inventory_equipment ON inventory_records(inventory_id, equipment_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS inventory_records`);
    await queryRunner.query(`DROP TABLE IF EXISTS inventories`);
    await queryRunner.query(`DROP TABLE IF EXISTS equipment`);
    await queryRunner.query(`DROP TABLE IF EXISTS equipment_types`);
    await queryRunner.query(`DROP TABLE IF EXISTS equipment_statuses`);
    await queryRunner.query(`DROP TABLE IF EXISTS locations`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "pgcrypto"`);
  }
}
