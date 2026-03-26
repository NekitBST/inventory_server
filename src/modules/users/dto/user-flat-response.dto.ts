import { ApiProperty } from '@nestjs/swagger';

export class UserFlatResponseDto {
  @ApiProperty({ example: '10a5f06f-c4d8-4233-9a6c-fffd55c8cf48' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Иван Петров' })
  fullName: string;

  @ApiProperty({ example: 2 })
  roleId: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-03-25T09:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-25T09:00:00.000Z' })
  updatedAt: Date;
}
