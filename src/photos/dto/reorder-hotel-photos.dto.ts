import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderHotelPhotosDto {
  @IsUUID('4')
  hotelId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  ids: string[];
}
