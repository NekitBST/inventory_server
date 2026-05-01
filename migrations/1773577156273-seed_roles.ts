import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedRoles1773577156273 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO roles (name)
      VALUES ('ADMIN')
      ON CONFLICT (name) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO roles (name)
      VALUES ('USER')
      ON CONFLICT (name) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM roles r
      WHERE r.name IN ('USER', 'ADMIN')
        AND NOT EXISTS (
          SELECT 1
          FROM users u
          WHERE u.role_id = r.id
        )
    `);
  }
}
