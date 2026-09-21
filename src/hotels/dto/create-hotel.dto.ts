import { Transform, Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateHotelDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Length(2, 2, { message: 'country must be an ISO 3166-1 alpha-2 code' })
  country: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  city: string;

  @IsString()
  @MinLength(4)
  @MaxLength(240)
  address: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  amenityIds?: string[];
}
