import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { HotelsService } from './hotels.service';
import { CreateHotelDto, HotelPaginationDto, UpdateHotelDto } from './dto';

@Controller()
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @MessagePattern('catalog.hotel.create')
  create(@Payload() dto: CreateHotelDto) {
    return this.hotelsService.create(dto);
  }

  @MessagePattern('catalog.hotel.findAll')
  findAll(@Payload() dto: HotelPaginationDto) {
    return this.hotelsService.findAll(dto);
  }

  @MessagePattern('catalog.hotel.findOne')
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.hotelsService.findOne(id);
  }

  @MessagePattern('catalog.hotel.findOnePublic')
  findOnePublic(@Payload('id', ParseUUIDPipe) id: string) {
    return this.hotelsService.findOnePublic(id);
  }

  @MessagePattern('catalog.hotel.update')
  update(@Payload() dto: UpdateHotelDto) {
    return this.hotelsService.update(dto);
  }

  @MessagePattern('catalog.hotel.remove')
  remove(@Payload('id', ParseUUIDPipe) id: string) {
    return this.hotelsService.remove(id);
  }
}
