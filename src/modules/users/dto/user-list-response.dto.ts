import { ApiProperty } from '@nestjs/swagger';
import { UserWithRoleResponseDto } from './user-with-role-response.dto';

export class UserListResponseDto {
  @ApiProperty({ type: () => [UserWithRoleResponseDto] })
  items: UserWithRoleResponseDto[];

  @ApiProperty({ example: 112 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
