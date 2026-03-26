import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('equipment_statuses')
export class EquipmentStatus {
  @ApiProperty({ example: 1, description: 'ID статуса' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'в работе', description: 'Название статуса' })
  @Column({ length: 50, unique: true })
  name: string;
}
