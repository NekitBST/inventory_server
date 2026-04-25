import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Equipment } from '../../equipment/entities/equipment.entity';

export type InventoryRecordResultStatus = 'FOUND' | 'DAMAGED';

@Entity('inventory_records')
export class InventoryRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'inventory_id' })
  inventoryId: string;

  @Column({ type: 'uuid', name: 'equipment_id' })
  equipmentId: string;

  @ManyToOne(() => Equipment, { nullable: true })
  @JoinColumn({ name: 'equipment_id' })
  equipment?: Equipment | null;

  @CreateDateColumn({ name: 'scanned_at' })
  scannedAt: Date;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'varchar', length: 20, name: 'result_status' })
  resultStatus: InventoryRecordResultStatus;
}
