import { Module } from '@nestjs/common';

import { AmenitiesModule } from '../amenities/amenities.module';
import { RoomTypesController } from './room-types.controller';
import { RoomTypesService } from './room-types.service';

@Module({
  imports: [AmenitiesModule],
  controllers: [RoomTypesController],
  providers: [RoomTypesService],
})
export class RoomTypesModule {}
