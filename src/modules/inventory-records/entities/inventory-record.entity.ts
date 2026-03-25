import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type InventoryRecordResultStatus = 'FOUND' | 'DAMAGED';

@Entity('inventory_records')
export class InventoryRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'inventory_id' })
  inventoryId: string;

  @Column({ type: 'uuid', name: 'equipment_id' })
  equipmentId: string;

  @CreateDateColumn({ name: 'scanned_at' })
  scannedAt: Date;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'varchar', length: 20, name: 'result_status' })
  resultStatus: InventoryRecordResultStatus;
}
