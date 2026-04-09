import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { REDIS_CACHE } from '../core/ports/tokens';

@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_CACHE)
    private readonly redis: Redis,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);

    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
