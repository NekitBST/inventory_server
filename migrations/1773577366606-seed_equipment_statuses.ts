import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedEquipmentStatuses1773577366606 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO equipment_statuses (name)
      VALUES ('в работе')
      ON CONFLICT (name) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO equipment_statuses (name)
      VALUES ('в ремонте')
      ON CONFLICT (name) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO equipment_statuses (name)
      VALUES ('списано')
      ON CONFLICT (name) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO equipment_statuses (name)
      VALUES ('утеряно')
      ON CONFLICT (name) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM equipment_statuses s
      WHERE s.name IN ('в работе', 'в ремонте', 'списано', 'утеряно')
        AND NOT EXISTS (
          SELECT 1
          FROM equipment e
          WHERE e.status_id = s.id
        )
    `);
  }
}
