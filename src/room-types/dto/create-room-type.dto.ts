import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
} from 'class-validator';

export class CreateRoomTypeDto {
  @IsUUID()
  hotelId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  capacity: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceCents: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(5000)
  defaultUnits: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  amenityIds?: string[];
}
