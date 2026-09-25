import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { CatalogEventsService } from './catalog-events.service';
import { IndexPageDto } from './dto';

@Controller()
export class CatalogEventsController {
  constructor(private readonly events: CatalogEventsService) {}

  @MessagePattern('catalog.hotel.findAllForIndex')
  findAllForIndex(@Payload() dto: IndexPageDto) {
    return this.events.listForIndex(dto.page ?? 1, dto.limit ?? 200);
  }
}
