import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateInventoryRecordDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @IsOptional()
  @IsString()
  @IsIn(['FOUND', 'DAMAGED'])
  resultStatus?: 'FOUND' | 'DAMAGED';
}
