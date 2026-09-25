import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export const AMENITY_SCOPES = ['hotel', 'room', 'both'] as const;

export type AmenityScope = (typeof AMENITY_SCOPES)[number];

export class CreateAmenityDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(/^[a-z0-9_]+$/, {
    message:
      'code must contain only lowercase letters, numbers and underscores',
  })
  code: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsIn(AMENITY_SCOPES)
  scope?: AmenityScope;
}
