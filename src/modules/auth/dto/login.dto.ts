import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Email пользователя',
  })
  @Transform(({ value }) => (value as string).toLowerCase())
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'adminpassword123',
    minLength: 8,
    description: 'Пароль пользователя',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
