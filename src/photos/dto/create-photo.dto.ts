import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsUUID,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

class PhotoFieldsDto {
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2000)
  url: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  position?: number;
}

export class CreateHotelPhotoDto extends PhotoFieldsDto {
  @IsUUID()
  hotelId: string;
}

export class CreateRoomTypePhotoDto extends PhotoFieldsDto {
  @IsUUID()
  roomTypeId: string;
}
