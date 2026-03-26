import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EquipmentFlatResponseDto {
  @ApiProperty({
    example: '10a5f06f-c4d8-4f42-9f35-97bc5b1f68aa',
    description: 'UUID оборудования',
  })
  id: string;

  @ApiProperty({ example: 'INV-000123', description: 'Инвентарный номер' })
  inventoryNumber: string;

  @ApiProperty({ example: 'Ноутбук Lenovo ThinkPad', description: 'Название' })
  name: string;

  @ApiPropertyOptional({
    example: 'SN-ABC-12345',
    nullable: true,
    description: 'Серийный номер',
  })
  serialNumber: string | null;

  @ApiPropertyOptional({
    example: 2,
    nullable: true,
    description: 'ID локации',
  })
  locationId: number | null;

  @ApiProperty({ example: 1, description: 'ID статуса' })
  statusId: number;

  @ApiProperty({ example: 3, description: 'ID типа оборудования' })
  typeId: number;

  @ApiProperty({
    example: '2026-03-26T09:00:00.000Z',
    description: 'Дата создания',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-03-26T09:30:00.000Z',
    description: 'Дата обновления',
  })
  updatedAt: Date;
}
