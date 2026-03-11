import { Module } from '@nestjs/common';
import { RedisCacheProvider } from './infrastructure/providers/redis.provider';
import { RedisCacheAdapter } from './infrastructure/adapters/redis-cache.adapter';
import { CACHE_PORT } from './core/ports/tokens';

@Module({
  providers: [
    RedisCacheProvider,
    {
      provide: CACHE_PORT,
      useClass: RedisCacheAdapter,
    },
  ],
  exports: [CACHE_PORT],
})
export class CacheModule {}
