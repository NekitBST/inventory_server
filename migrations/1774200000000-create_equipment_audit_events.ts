import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEquipmentAuditEvents1774200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE equipment_audit_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
        actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        actor_name VARCHAR(255),
        action VARCHAR(50) NOT NULL,
        summary VARCHAR(255) NOT NULL,
        details TEXT,
        reason TEXT,
        from_state JSONB,
        to_state JSONB,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        CHECK (
          action IN (
            'CREATED',
            'UPDATED',
            'STATUS_CHANGED',
            'LOCATION_CHANGED',
            'TYPE_CHANGED',
            'INVENTORY_SCANNED',
            'INVENTORY_RECORD_UPDATED',
            'DELETED'
          )
        )
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_equipment_audit_equipment_created_at
      ON equipment_audit_events(equipment_id, created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS equipment_audit_events`);
  }
}
