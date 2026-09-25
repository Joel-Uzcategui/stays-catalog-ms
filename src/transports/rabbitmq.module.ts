import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { SEARCH_SERVICE, envs } from '../config';

const clients = ClientsModule.register([
  {
    name: SEARCH_SERVICE,
    transport: Transport.RMQ,
    options: {
      urls: [envs.rabbitmqUrl],
      queue: envs.searchQueue,
      queueOptions: { durable: true },
    },
  },
]);

@Module({
  imports: [clients],
  exports: [clients],
})
export class RabbitMQModule {}
