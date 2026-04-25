import { ApiProperty } from '@nestjs/swagger';
import { Location } from '../entities/location.entity';

export class LocationListResponseDto {
  @ApiProperty({ type: () => [Location] })
  items: Location[];

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
