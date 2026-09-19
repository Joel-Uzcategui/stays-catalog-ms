import { PartialType } from '@nestjs/mapped-types';
import { IsUUID } from 'class-validator';

import { CreateHotelDto } from './create-hotel.dto';

export class UpdateHotelDto extends PartialType(CreateHotelDto) {
  @IsUUID()
  id: string;
}
