import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { AmenitiesService } from './amenities.service';
import {
  AmenityPaginationDto,
  CreateAmenityDto,
  UpdateAmenityDto,
} from './dto';

@Controller()
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @MessagePattern('catalog.amenity.create')
  create(@Payload() dto: CreateAmenityDto) {
    return this.amenitiesService.create(dto);
  }

  @MessagePattern('catalog.amenity.findAll')
  findAll(@Payload() dto: AmenityPaginationDto) {
    return this.amenitiesService.findAll(dto);
  }

  @MessagePattern('catalog.amenity.findOne')
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.amenitiesService.findOne(id);
  }

  @MessagePattern('catalog.amenity.update')
  update(@Payload() dto: UpdateAmenityDto) {
    return this.amenitiesService.update(dto);
  }

  @MessagePattern('catalog.amenity.remove')
  remove(@Payload('id', ParseUUIDPipe) id: string) {
    return this.amenitiesService.remove(id);
  }

  @MessagePattern('catalog.amenity.findForHotel')
  findForHotel(@Payload('hotelId', ParseUUIDPipe) hotelId: string) {
    return this.amenitiesService.findForHotel(hotelId);
  }

  @MessagePattern('catalog.amenity.findForRoomType')
  findForRoomType(@Payload('roomTypeId', ParseUUIDPipe) roomTypeId: string) {
    return this.amenitiesService.findForRoomType(roomTypeId);
  }
}
