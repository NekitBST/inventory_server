import { ApiProperty } from '@nestjs/swagger';
import { InventoryWithUserResponseDto } from './inventory-with-user-response.dto';

export class InventoryListResponseDto {
  @ApiProperty({ type: () => [InventoryWithUserResponseDto] })
  items: InventoryWithUserResponseDto[];

  @ApiProperty({ example: 57 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
