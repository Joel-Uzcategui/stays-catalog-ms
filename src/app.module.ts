import { Module } from '@nestjs/common';

import { AmenitiesModule } from './amenities/amenities.module';
import { CitiesModule } from './cities/cities.module';
import { HotelsModule } from './hotels/hotels.module';
import { PhotosModule } from './photos/photos.module';
import { RoomTypesModule } from './room-types/room-types.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    CitiesModule,
    HotelsModule,
    RoomTypesModule,
    AmenitiesModule,
    PhotosModule,
  ],
})
export class AppModule {}
