import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { RoomTypesService } from './room-types.service';
import {
  CreateRoomTypeDto,
  RoomTypeGlobalPaginationDto,
  RoomTypePaginationDto,
  UpdateRoomTypeDto,
} from './dto';

@Controller()
export class RoomTypesController {
  constructor(private readonly roomTypesService: RoomTypesService) {}

  @MessagePattern('catalog.roomType.create')
  create(@Payload() dto: CreateRoomTypeDto) {
    return this.roomTypesService.create(dto);
  }

  @MessagePattern('catalog.roomType.findAll')
  findAll(@Payload() dto: RoomTypePaginationDto) {
    return this.roomTypesService.findAll(dto);
  }

  @MessagePattern('catalog.roomType.findAllGlobal')
  findAllGlobal(@Payload() dto: RoomTypeGlobalPaginationDto) {
    return this.roomTypesService.findAllGlobal(dto);
  }

  @MessagePattern('catalog.roomType.findAllPublic')
  findAllPublic(@Payload() dto: RoomTypePaginationDto) {
    return this.roomTypesService.findAllPublic(dto);
  }

  @MessagePattern('catalog.roomType.findOne')
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.roomTypesService.findOne(id);
  }

  @MessagePattern('catalog.roomType.findOnePublic')
  findOnePublic(@Payload('id', ParseUUIDPipe) id: string) {
    return this.roomTypesService.findOnePublic(id);
  }

  @MessagePattern('catalog.roomType.update')
  update(@Payload() dto: UpdateRoomTypeDto) {
    return this.roomTypesService.update(dto);
  }

  @MessagePattern('catalog.roomType.remove')
  remove(@Payload('id', ParseUUIDPipe) id: string) {
    return this.roomTypesService.remove(id);
  }
}
