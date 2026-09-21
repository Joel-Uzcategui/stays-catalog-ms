import { Module } from '@nestjs/common';

import { AmenitiesModule } from '../amenities/amenities.module';
import { CitiesModule } from '../cities/cities.module';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';

@Module({
  imports: [CitiesModule, AmenitiesModule],
  controllers: [HotelsController],
  providers: [HotelsService],
})
export class HotelsModule {}
