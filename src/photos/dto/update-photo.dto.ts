import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdatePhotoDto {
  @IsUUID()
  id: string;

  // A storage key, not a URL, and anchored so it cannot walk out of its prefix.
  @IsOptional()
  @IsString()
  @MaxLength(512)
  @Matches(/^[A-Za-z0-9][A-Za-z0-9/_.-]*$/, {
    message: 'url must be a storage key',
  })
  @Matches(/^(?!.*\.\.)/, { message: 'url must not contain ..' })
  url?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  position?: number;
}
