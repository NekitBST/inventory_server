import { ApiProperty } from '@nestjs/swagger';
import { EquipmentType } from '../entities/equipment-type.entity';

export class EquipmentTypeListResponseDto {
  @ApiProperty({ type: () => [EquipmentType] })
  items: EquipmentType[];

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
