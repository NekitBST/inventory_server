import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('equipment_statuses')
export class EquipmentStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  name: string;
}
