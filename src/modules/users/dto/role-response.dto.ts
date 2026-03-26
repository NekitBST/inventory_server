import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({ example: 2 })
  id: number;

  @ApiProperty({ example: 'USER' })
  name: string;
}
