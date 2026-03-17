import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('equipment_types')
export class EquipmentType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  name: string;
}
