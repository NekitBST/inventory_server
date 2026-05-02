import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Equipment } from './equipment.entity';
import { User } from '../../users/entities/user.entity';

export type EquipmentAuditAction =
  | 'CREATED'
  | 'UPDATED'
  | 'STATUS_CHANGED'
  | 'LOCATION_CHANGED'
  | 'TYPE_CHANGED'
  | 'INVENTORY_SCANNED'
  | 'INVENTORY_RECORD_UPDATED'
  | 'DELETED';

@Entity('equipment_audit_events')
export class EquipmentAuditEvent {
  @ApiProperty({ example: 'd8a8571b-c662-4fbe-bcb9-3b72f8de68e7' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '10a5f06f-c4d8-4f42-9f35-97bc5b1f68aa' })
  @Column({ type: 'uuid', name: 'equipment_id' })
  equipmentId: string;

  @ManyToOne(() => Equipment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'equipment_id' })
  equipment: Equipment;

  @ApiPropertyOptional({ example: 'e7d9d8d8-30cb-4f58-b11c-4939587f715d' })
  @Column({ type: 'uuid', name: 'actor_user_id', nullable: true })
  actorUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_user_id' })
  actorUser?: User | null;

  @ApiPropertyOptional({ example: 'Иван Петров' })
  @Column({ type: 'varchar', name: 'actor_name', length: 255, nullable: true })
  actorName: string | null;

  @ApiProperty({
    enum: [
      'CREATED',
      'UPDATED',
      'STATUS_CHANGED',
      'LOCATION_CHANGED',
      'TYPE_CHANGED',
      'INVENTORY_SCANNED',
      'INVENTORY_RECORD_UPDATED',
      'DELETED',
    ],
  })
  @Column({ type: 'varchar', length: 50 })
  action: EquipmentAuditAction;

  @ApiProperty({ example: 'Изменён статус оборудования' })
  @Column({ type: 'varchar', length: 255 })
  summary: string;

  @ApiPropertyOptional({ example: 'Статус обновлён при инвентаризации' })
  @Column({ type: 'text', nullable: true })
  details: string | null;

  @ApiPropertyOptional({ example: 'Ручная корректировка оператором' })
  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @ApiPropertyOptional({ example: { status: 'в работе', location: 'Кабинет 101' } })
  @Column({ type: 'jsonb', name: 'from_state', nullable: true })
  fromState: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: { status: 'в ремонте', location: 'Сервис' } })
  @Column({ type: 'jsonb', name: 'to_state', nullable: true })
  toState: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: { inventoryId: '5b8f0b5f-a8f9-4cdb-a9d3-8d3137d8ce74' } })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-05-02T10:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
