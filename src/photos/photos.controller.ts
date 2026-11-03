import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { PhotosService } from './photos.service';
import {
  CreateHotelPhotoDto,
  CreateRoomTypePhotoDto,
  ReorderHotelPhotosDto,
  UpdatePhotoDto,
} from './dto';

@Controller()
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @MessagePattern('catalog.photo.createForHotel')
  createForHotel(@Payload() dto: CreateHotelPhotoDto) {
    return this.photosService.createForHotel(dto);
  }

  @MessagePattern('catalog.photo.createForRoomType')
  createForRoomType(@Payload() dto: CreateRoomTypePhotoDto) {
    return this.photosService.createForRoomType(dto);
  }

  @MessagePattern('catalog.photo.findOne')
  findOne(@Payload('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.photosService.findOne(id);
  }

  @MessagePattern('catalog.photo.findForHotel')
  findForHotel(@Payload('hotelId', ParseUUIDPipe) hotelId: string) {
    return this.photosService.findForHotel(hotelId);
  }

  @MessagePattern('catalog.photo.findForRoomType')
  findForRoomType(@Payload('roomTypeId', ParseUUIDPipe) roomTypeId: string) {
    return this.photosService.findForRoomType(roomTypeId);
  }

  @MessagePattern('catalog.photo.reorderForHotel')
  reorderForHotel(@Payload() dto: ReorderHotelPhotosDto) {
    return this.photosService.reorderForHotel(dto);
  }

  @MessagePattern('catalog.photo.update')
  update(@Payload() dto: UpdatePhotoDto) {
    return this.photosService.update(dto);
  }

  @MessagePattern('catalog.photo.remove')
  remove(@Payload('id', ParseUUIDPipe) id: string) {
    return this.photosService.remove(id);
  }
}
