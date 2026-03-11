import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { CachePort } from '../../core/ports/cache.port';
import { REDIS_CACHE } from '../../core/ports/tokens';

@Injectable()
export class RedisCacheAdapter implements CachePort {
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

  async set(key: string, value: unknown, ttl = 60) {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async del(key: string) {
    await this.redis.del(key);
  }

  async delPattern(pattern: string) {
    const keys = await this.redis.keys(pattern);

    if (keys.length) {
      await this.redis.del(keys);
    }
  }
}
