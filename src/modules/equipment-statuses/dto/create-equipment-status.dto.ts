import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateEquipmentStatusDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;
}
