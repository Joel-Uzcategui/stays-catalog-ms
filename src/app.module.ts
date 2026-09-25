import { Module } from '@nestjs/common';

import { AmenitiesModule } from './amenities/amenities.module';
import { CitiesModule } from './cities/cities.module';
import { HotelsModule } from './hotels/hotels.module';
import { PhotosModule } from './photos/photos.module';
import { RoomTypesModule } from './room-types/room-types.module';
import { CatalogEventsModule } from './events/catalog-events.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    CatalogEventsModule,
    CitiesModule,
    HotelsModule,
    RoomTypesModule,
    AmenitiesModule,
    PhotosModule,
  ],
})
export class AppModule {}
