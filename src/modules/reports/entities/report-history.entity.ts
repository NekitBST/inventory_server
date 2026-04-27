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
import { User } from '../../users/entities/user.entity';

export type ReportType = 'equipment' | 'inventory-records';
export type ReportFormat = 'csv' | 'xlsx';

@Entity('report_history')
export class ReportHistory {
  @ApiProperty({ example: 'b5f3a1c3-0c18-4db6-b6ce-2a3ab4c09d9e' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'b5f3a1c3-0c18-4db6-b6ce-2a3ab4c09d9e' })
  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @ApiProperty({ enum: ['equipment', 'inventory-records'] })
  @Column({ type: 'varchar', length: 50, name: 'report_type' })
  reportType: ReportType;

  @ApiProperty({ example: 'Отчет об оборудовании' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ enum: ['csv', 'xlsx'] })
  @Column({ type: 'varchar', length: 10 })
  format: ReportFormat;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @Column({ type: 'jsonb', name: 'snapshot' })
  snapshot: Record<string, unknown>;

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', name: 'is_pinned', default: false })
  isPinned: boolean;

  @ApiProperty({ example: '2026-04-27T10:15:00.000Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-27T10:15:00.000Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
