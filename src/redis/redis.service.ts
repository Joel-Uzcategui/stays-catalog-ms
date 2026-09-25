import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

import { envs } from '../config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private available = false;

  constructor() {
    this.client = new Redis(envs.redisUrl, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });

    this.client.on('ready', () => {
      this.available = true;
      this.logger.log('Redis connected');
    });

    this.client.on('error', (error: Error) => {
      if (this.available) {
        this.logger.warn(`Redis unavailable: ${error.message}`);
      }

      this.available = false;
    });
  }

  async onModuleInit() {
    await this.client.connect().catch((error: Error) => {
      this.logger.warn(`Redis unavailable: ${error.message}`);
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.available) {
      return null;
    }

    try {
      const raw = await this.client.get(key);

      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      this.logger.warn(`Cache read failed for ${key}: ${String(error)}`);

      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number) {
    if (!this.available) {
      return;
    }

    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(`Cache write failed for ${key}: ${String(error)}`);
    }
  }

  async del(key: string) {
    if (!this.available) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.warn(`Cache delete failed for ${key}: ${String(error)}`);
    }
  }
}
