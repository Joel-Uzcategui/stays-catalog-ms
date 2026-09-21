import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

import { CreateRoomTypeDto } from './create-room-type.dto';

export class UpdateRoomTypeDto extends PartialType(
  OmitType(CreateRoomTypeDto, ['hotelId'] as const),
) {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
