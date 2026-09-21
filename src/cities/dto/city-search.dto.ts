import { Transform, Type } from 'class-transformer';
import {
  IsISO31661Alpha2,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';

export class CitySearchDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsISO31661Alpha2()
  country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Max(25)
  limit?: number;
}
