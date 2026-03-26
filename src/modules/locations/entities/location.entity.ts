import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('locations')
export class Location {
  @ApiProperty({ example: 1, description: 'ID локации' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Кабинет 101', description: 'Название локации' })
  @Column({ length: 255, unique: true })
  name: string;
}
