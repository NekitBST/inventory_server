import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class InventoryRecordDictionaryItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'В работе' })
  name: string;
}

class InventoryRecordTypeItemDto {
  @ApiProperty({ example: 4 })
  id: number;

  @ApiProperty({ example: 'Коммутатор' })
  name: string;
}

class InventoryRecordLocationItemDto {
  @ApiProperty({ example: 6 })
  id: number;

  @ApiProperty({ example: 'Кабинет №2' })
  name: string;
}

class InventoryRecordEquipmentDto {
  @ApiProperty({
    example: '10a5f06f-c4d8-4f42-9f35-97bc5b1f68aa',
    description: 'UUID оборудования',
  })
  id: string;

  @ApiProperty({ example: 'INV-000123', description: 'Инвентарный номер' })
  inventoryNumber: string;

  @ApiProperty({
    example: 'Huawei S5735-L24T4X-A1',
    description: 'Название оборудования',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'HW-S5735-0001',
    nullable: true,
    description: 'Серийный номер оборудования',
  })
  serialNumber?: string | null;

  @ApiPropertyOptional({
    type: () => InventoryRecordDictionaryItemDto,
    nullable: true,
    description: 'Статус оборудования',
  })
  status?: InventoryRecordDictionaryItemDto | null;

  @ApiPropertyOptional({
    type: () => InventoryRecordTypeItemDto,
    nullable: true,
  })
  type?: InventoryRecordTypeItemDto | null;

  @ApiPropertyOptional({
    type: () => InventoryRecordLocationItemDto,
    nullable: true,
  })
  location?: InventoryRecordLocationItemDto | null;
}

export class InventoryRecordResponseDto {
  @ApiProperty({
    example: '9abebc84-85be-4f83-a1ee-e7d5a18c39fb',
    description: 'UUID записи инвентаризации',
  })
  id: string;

  @ApiProperty({
    example: '5b8f0b5f-a8f9-4cdb-a9d3-8d3137d8ce74',
    description: 'UUID инвентаризации',
  })
  inventoryId: string;

  @ApiProperty({
    example: '10a5f06f-c4d8-4f42-9f35-97bc5b1f68aa',
    description: 'UUID оборудования',
  })
  equipmentId: string;

  @ApiPropertyOptional({
    type: () => InventoryRecordEquipmentDto,
    nullable: true,
    description: 'Краткая информация об оборудовании',
  })
  equipment?: InventoryRecordEquipmentDto | null;

  @ApiProperty({
    example: '2026-03-26T09:15:00.000Z',
    description: 'Время сканирования',
  })
  scannedAt: Date;

  @ApiProperty({
    example: 'В работе',
    description: 'Статус оборудования на момент проведения',
  })
  statusAtEventTime: string;

  @ApiPropertyOptional({
    example: 'Кабинет №2',
    nullable: true,
    description: 'Локация оборудования на момент проведения',
  })
  locationAtEventTime: string | null;

  @ApiPropertyOptional({
    example: 'Отличное состояние, все работает',
    nullable: true,
    description: 'Комментарий',
  })
  comment: string | null;

  @ApiProperty({
    enum: ['FOUND', 'DAMAGED'],
    description: 'Результат сканирования',
  })
  resultStatus: 'FOUND' | 'DAMAGED';
}
