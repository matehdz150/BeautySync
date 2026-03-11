import { Module } from '@nestjs/common';
import { RedisCacheProvider } from './infrastructure/providers/redis.provider';
import { RedisCacheAdapter } from './infrastructure/adapters/redis-cache.adapter';
import { CACHE_PORT, SLOT_LOCK_PORT } from './core/ports/tokens';
import { RedisSlotLockAdapter } from './infrastructure/adapters/redis-slot-lock.adapter';

@Module({
  providers: [
    RedisCacheProvider,
    {
      provide: CACHE_PORT,
      useClass: RedisCacheAdapter,
    },
    RedisSlotLockAdapter,
    {
      provide: SLOT_LOCK_PORT,
      useExisting: RedisSlotLockAdapter,
    },
  ],
  exports: [CACHE_PORT],
})
export class CacheModule {}
