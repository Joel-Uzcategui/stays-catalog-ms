import { Module } from '@nestjs/common';

import { HotelsModule } from './hotels/hotels.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, HotelsModule],
})
export class AppModule {}
