import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('equipment_types')
export class EquipmentType {
  @ApiProperty({ example: 1, description: 'ID типа оборудования' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'Ноутбук',
    description: 'Название типа оборудования',
  })
  @Column({ length: 100, unique: true })
  name: string;
}
