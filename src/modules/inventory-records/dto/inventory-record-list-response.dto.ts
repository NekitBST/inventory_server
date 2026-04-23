import { ApiProperty } from '@nestjs/swagger';
import { InventoryRecordResponseDto } from './inventory-record-response.dto';

export class InventoryRecordListResponseDto {
  @ApiProperty({ type: () => [InventoryRecordResponseDto] })
  items: InventoryRecordResponseDto[];

  @ApiProperty({ example: 43 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 30 })
  limit: number;
}
