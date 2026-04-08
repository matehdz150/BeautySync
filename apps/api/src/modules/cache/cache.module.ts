import { Module } from '@nestjs/common';
import { RedisCacheProvider } from './infrastructure/providers/redis.provider';
import { RedisCacheAdapter } from './infrastructure/adapters/redis-cache.adapter';
import { CACHE_PORT, REDIS_CACHE, SLOT_LOCK_PORT } from './core/ports/tokens';
import { RedisSlotLockAdapter } from './infrastructure/adapters/redis-slot-lock.adapter';
import { BranchSettingsCacheService } from './application/branch-settings-cache.service';
import { RedisService } from './application/redis.service';
import { BranchCacheService } from './application/branch-cache.service';
import { PublicBranchCacheService } from './application/public-branch-cache.service';
import { BranchServicesCacheService } from './application/branch-services-cache.service';
import { BranchStaffCacheService } from './application/branch-staff-cache.service';

@Module({
  providers: [
    RedisCacheProvider,
    RedisService,
    BranchSettingsCacheService,
    BranchCacheService,
    PublicBranchCacheService,
    BranchServicesCacheService,
    BranchStaffCacheService,
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
  exports: [
    REDIS_CACHE,
    CACHE_PORT,
    SLOT_LOCK_PORT,
    RedisService,
    BranchCacheService,
    BranchSettingsCacheService,
    PublicBranchCacheService,
    BranchServicesCacheService,
    BranchStaffCacheService,
  ],
})
export class CacheModule {}
