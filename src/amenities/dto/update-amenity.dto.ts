import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

import { CreateAmenityDto } from './create-amenity.dto';

export class UpdateAmenityDto extends PartialType(CreateAmenityDto) {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
