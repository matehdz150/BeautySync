import Redis from 'ioredis';
import { REDIS_CACHE } from '../../core/ports/tokens';

export const RedisCacheProvider = {
  provide: REDIS_CACHE,
  useFactory: () => {
    return new Redis({
      host: process.env.REDIS_CACHE_HOST || 'localhost',
      port: Number(process.env.REDIS_CACHE_PORT || 6380),
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  },
};
