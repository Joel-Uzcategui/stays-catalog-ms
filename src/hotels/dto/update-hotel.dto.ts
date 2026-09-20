import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

import { CreateHotelDto } from './create-hotel.dto';

export class UpdateHotelDto extends PartialType(CreateHotelDto) {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
