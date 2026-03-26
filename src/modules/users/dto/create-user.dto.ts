import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  @Transform(({ value }) => (value as string).toLowerCase())
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'password123',
    minLength: 8,
    description: 'Пароль пользователя',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Иван Петров', description: 'ФИО пользователя' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 2, description: 'ID роли пользователя' })
  @IsInt()
  roleId: number;
}
