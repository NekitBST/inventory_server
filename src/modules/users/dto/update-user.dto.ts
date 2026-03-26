import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Иван Петров', description: 'Новое ФИО' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @ApiPropertyOptional({ example: 2, description: 'Новый ID роли' })
  @IsOptional()
  @IsInt()
  roleId?: number;

  @ApiPropertyOptional({
    example: 'newpassword123',
    minLength: 8,
    description: 'Новый пароль',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password?: string;
}
