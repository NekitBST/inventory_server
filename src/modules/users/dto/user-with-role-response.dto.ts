import { ApiProperty } from '@nestjs/swagger';
import { UserFlatResponseDto } from './user-flat-response.dto';
import { RoleResponseDto } from './role-response.dto';

export class UserWithRoleResponseDto extends UserFlatResponseDto {
  @ApiProperty({ type: RoleResponseDto })
  role: RoleResponseDto;
}
