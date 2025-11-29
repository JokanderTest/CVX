// src/common/redis.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: RedisClientType;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL');

    this.client = createClient({
      url,
    });

    this.client.on('error', (err) => {
      console.error('[REDIS] Connection error:', err);
    });

    this.client.connect().then(() => {
      console.log('[REDIS] Connected successfully');
    });
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
