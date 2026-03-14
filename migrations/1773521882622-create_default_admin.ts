import { hash } from 'argon2';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDefaultAdmin1773500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const adminLogin = process.env.ADMIN_LOGIN;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminLogin || !adminPassword) {
      throw new Error(
        'ADMIN_LOGIN and ADMIN_PASSWORD must be set in environment before running this migration.',
      );
    }

    const existingRoleRows = await queryRunner.query(
      `SELECT id FROM roles WHERE name = $1 LIMIT 1`,
      ['ADMIN'],
    );

    let adminRoleId: number;

    if (existingRoleRows.length > 0) {
      adminRoleId = existingRoleRows[0].id;
    } else {
      const insertedRoleRows = await queryRunner.query(
        `INSERT INTO roles (name) VALUES ($1) RETURNING id`,
        ['ADMIN'],
      );
      adminRoleId = insertedRoleRows[0].id;
    }

    const existingAdminRows = await queryRunner.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [adminLogin.toLowerCase()],
    );

    if (existingAdminRows.length > 0) {
      return;
    }

    const passwordHash = await hash(adminPassword);

    await queryRunner.query(
      `
        INSERT INTO users (email, password_hash, full_name, role_id, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        adminLogin.toLowerCase(),
        passwordHash,
        'Default Administrator',
        adminRoleId,
        true,
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const adminLogin = process.env.ADMIN_LOGIN;

    if (!adminLogin) {
      throw new Error(
        'ADMIN_LOGIN must be set in environment before reverting this migration.',
      );
    }

    await queryRunner.query(
      `
        DELETE FROM users
        WHERE email = $1
          AND full_name = $2
      `,
      [adminLogin.toLowerCase(), 'Default Administrator'],
    );
  }
}
