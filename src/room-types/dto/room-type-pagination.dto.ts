import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsPositive,
  IsUUID,
  Max,
} from 'class-validator';

export class RoomTypePaginationDto {
  @IsUUID()
  hotelId: string;

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
  @Transform(({ value }) =>
    value === undefined ? undefined : value === true || value === 'true',
  )
  @IsBoolean()
  active?: boolean;
}
