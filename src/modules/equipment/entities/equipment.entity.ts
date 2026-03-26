import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Location } from '../../locations/entities/location.entity';
import { EquipmentStatus } from '../../equipment-statuses/entities/equipment-status.entity';
import { EquipmentType } from '../../equipment-types/entities/equipment-type.entity';

@Entity('equipment')
export class Equipment {
  @ApiProperty({
    example: '10a5f06f-c4d8-4f42-9f35-97bc5b1f68aa',
    description: 'UUID оборудования',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'INV-000123', description: 'Инвентарный номер' })
  @Column({ name: 'inventory_number', length: 100, unique: true })
  inventoryNumber: string;

  @ApiProperty({ example: 'Ноутбук Lenovo ThinkPad', description: 'Название' })
  @Column({ length: 255 })
  name: string;

  @ApiPropertyOptional({
    example: 'SN-ABC-12345',
    nullable: true,
    description: 'Серийный номер',
  })
  @Column({
    type: 'varchar',
    name: 'serial_number',
    length: 100,
    unique: true,
    nullable: true,
  })
  serialNumber: string | null;

  @ApiPropertyOptional({
    example: 2,
    nullable: true,
    description: 'ID локации',
  })
  @Column({ type: 'int', name: 'location_id', nullable: true })
  locationId: number | null;

  @ApiProperty({ example: 1, description: 'ID статуса' })
  @Column({ type: 'int', name: 'status_id' })
  statusId: number;

  @ApiProperty({ example: 3, description: 'ID типа оборудования' })
  @Column({ type: 'int', name: 'type_id' })
  typeId: number;

  @ApiPropertyOptional({ type: () => Location, nullable: true })
  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'location_id' })
  location: Location | null;

  @ApiProperty({ type: () => EquipmentStatus })
  @ManyToOne(() => EquipmentStatus)
  @JoinColumn({ name: 'status_id' })
  status: EquipmentStatus;

  @ApiProperty({ type: () => EquipmentType })
  @ManyToOne(() => EquipmentType)
  @JoinColumn({ name: 'type_id' })
  type: EquipmentType;

  @ApiProperty({ example: '2026-03-26T09:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-26T09:30:00.000Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
