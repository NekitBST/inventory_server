import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Location } from '../../locations/entities/location.entity';
import { EquipmentStatus } from '../../equipment-statuses/entities/equipment-status.entity';
import { EquipmentType } from '../../equipment-types/entities/equipment-type.entity';

@Entity('equipment')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inventory_number', length: 100, unique: true })
  inventoryNumber: string;

  @Column({ length: 255 })
  name: string;

  @Column({
    type: 'varchar',
    name: 'serial_number',
    length: 100,
    unique: true,
    nullable: true,
  })
  serialNumber: string | null;

  @Column({ type: 'int', name: 'location_id', nullable: true })
  locationId: number | null;

  @Column({ type: 'int', name: 'status_id' })
  statusId: number;

  @Column({ type: 'int', name: 'type_id' })
  typeId: number;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'location_id' })
  location: Location | null;

  @ManyToOne(() => EquipmentStatus)
  @JoinColumn({ name: 'status_id' })
  status: EquipmentStatus;

  @ManyToOne(() => EquipmentType)
  @JoinColumn({ name: 'type_id' })
  type: EquipmentType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
