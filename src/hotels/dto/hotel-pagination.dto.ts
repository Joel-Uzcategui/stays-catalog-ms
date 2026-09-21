import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsISO31661Alpha2,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';

export class HotelPaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsISO31661Alpha2()
  country?: string;

  @IsOptional()
  @IsUUID('4')
  cityId?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : value === true || value === 'true',
  )
  @IsBoolean()
  active?: boolean;
}
