import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EquipmentFlatResponseDto } from './equipment-flat-response.dto';
import { Location } from '../../locations/entities/location.entity';
import { EquipmentStatus } from '../../equipment-statuses/entities/equipment-status.entity';
import { EquipmentType } from '../../equipment-types/entities/equipment-type.entity';

export class EquipmentWithRelationsResponseDto extends EquipmentFlatResponseDto {
  @ApiPropertyOptional({ type: () => Location, nullable: true })
  location: Location | null;

  @ApiProperty({ type: () => EquipmentStatus })
  status: EquipmentStatus;

  @ApiProperty({ type: () => EquipmentType })
  type: EquipmentType;
}
