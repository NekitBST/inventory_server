import { ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryResponseDto } from './inventory-response.dto';
import { InventoryCreatedByUserResponseDto } from './inventory-created-by-user-response.dto';

export class InventoryWithUserResponseDto extends InventoryResponseDto {
  @ApiPropertyOptional({
    type: () => InventoryCreatedByUserResponseDto,
    description: 'Пользователь, создавший инвентаризацию',
  })
  createdByUser?: InventoryCreatedByUserResponseDto;
}
