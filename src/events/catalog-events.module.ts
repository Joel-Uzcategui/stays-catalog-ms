import { Global, Module } from '@nestjs/common';

import { RabbitMQModule } from '../transports/rabbitmq.module';
import { CatalogEventsController } from './catalog-events.controller';
import { CatalogEventsService } from './catalog-events.service';

@Global()
@Module({
  imports: [RabbitMQModule],
  controllers: [CatalogEventsController],
  providers: [CatalogEventsService],
  exports: [CatalogEventsService],
})
export class CatalogEventsModule {}
