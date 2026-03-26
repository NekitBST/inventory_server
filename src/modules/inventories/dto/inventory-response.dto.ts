import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryResponseDto {
  @ApiProperty({
    example: '5b8f0b5f-a8f9-4cdb-a9d3-8d3137d8ce74',
    description: 'UUID инвентаризации',
  })
  id: string;

  @ApiProperty({
    example: '2026-03-26T09:00:00.000Z',
    description: 'Дата начала инвентаризации',
  })
  startedAt: Date;

  @ApiPropertyOptional({
    example: '2026-03-26T17:00:00.000Z',
    nullable: true,
    description: 'Дата завершения инвентаризации',
  })
  finishedAt: Date | null;

  @ApiProperty({
    example: '10a5f06f-c4d8-4f42-9f35-97bc5b1f68aa',
    description: 'UUID создателя',
  })
  createdBy: string;

  @ApiProperty({
    enum: ['OPEN', 'CLOSED'],
    description: 'Статус инвентаризации',
  })
  status: 'OPEN' | 'CLOSED';
}
