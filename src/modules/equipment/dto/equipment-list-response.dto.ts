import { ApiProperty } from '@nestjs/swagger';
import { EquipmentWithRelationsResponseDto } from './equipment-with-relations-response.dto';

export class EquipmentListResponseDto {
  @ApiProperty({ type: () => EquipmentWithRelationsResponseDto, isArray: true })
  items: EquipmentWithRelationsResponseDto[];

  @ApiProperty({ example: 5, description: 'Общее количество записей' })
  total: number;

  @ApiProperty({ example: 1, description: 'Текущая страница' })
  page: number;

  @ApiProperty({ example: 20, description: 'Размер страницы' })
  limit: number;
}
