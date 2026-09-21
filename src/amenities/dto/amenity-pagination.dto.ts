import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';

import { AMENITY_SCOPES, type AmenityScope } from './create-amenity.dto';

export class AmenityPaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Max(200)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsIn(AMENITY_SCOPES)
  scope?: AmenityScope;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : value === true || value === 'true',
  )
  @IsBoolean()
  active?: boolean;
}
