import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateEquipmentStatusDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;
}
