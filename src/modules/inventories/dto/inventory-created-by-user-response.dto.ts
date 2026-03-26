import { ApiProperty } from '@nestjs/swagger';

export class InventoryCreatedByUserResponseDto {
  @ApiProperty({
    example: '10a5f06f-c4d8-4f42-9f35-97bc5b1f68aa',
    description: 'UUID пользователя',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  email: string;

  @ApiProperty({ example: 'Иван Петров', description: 'ФИО пользователя' })
  fullName: string;

  @ApiProperty({ example: 2, description: 'ID роли пользователя' })
  roleId: number;
}
