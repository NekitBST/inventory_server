import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiProperty({
    example: '2026-03-26T09:15:00.000Z',
    description: 'Время сканирования',
  })
  scannedAt: Date;

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
