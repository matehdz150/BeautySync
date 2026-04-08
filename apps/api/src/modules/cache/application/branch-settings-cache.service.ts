import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import type { DB } from 'src/modules/db/client';
import { branchSettings } from 'src/modules/db/schema/branches/branchSettings';
import { requestContext } from 'src/modules/metrics/request-context';

import { CACHE_PORT } from '../core/ports/tokens';
import { CachePort } from '../core/ports/cache.port';

type BranchSettingsCacheValue = {
  timezone: string;
  minBookingNoticeMin: number;
  maxBookingAheadDays: number;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  cancelationWindowMin: number;
};

@Injectable()
export class BranchSettingsCacheService {
  private static readonly TTL_SECONDS = 600;
  private static readonly DEFAULT_TIMEZONE = 'America/Mexico_City';

  constructor(
    @Inject('DB')
    private readonly db: DB,

    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async get(branchId: string): Promise<BranchSettingsCacheValue> {
    return requestContext.getOrSet(`branch_settings:${branchId}`, async () => {
      const cacheKey = this.buildKey(branchId);
      const cached = await this.cache.get<BranchSettingsCacheValue>(cacheKey);

      if (cached) {
        return cached;
      }

      const row = await this.db.query.branchSettings.findFirst({
        columns: {
          timezone: true,
          minBookingNoticeMin: true,
          maxBookingAheadDays: true,
          bufferBeforeMin: true,
          bufferAfterMin: true,
          cancelationWindowMin: true,
        },
        where: eq(branchSettings.branchId, branchId),
      });

      const value: BranchSettingsCacheValue = {
        timezone: row?.timezone ?? BranchSettingsCacheService.DEFAULT_TIMEZONE,
        minBookingNoticeMin: row?.minBookingNoticeMin ?? 0,
        maxBookingAheadDays: row?.maxBookingAheadDays ?? 60,
        bufferBeforeMin: row?.bufferBeforeMin ?? 0,
        bufferAfterMin: row?.bufferAfterMin ?? 0,
        cancelationWindowMin: row?.cancelationWindowMin ?? 120,
      };

      await this.cache.set(
        cacheKey,
        value,
        BranchSettingsCacheService.TTL_SECONDS,
      );

      return value;
    });
  }

  async getTimezone(branchId: string): Promise<string> {
    const settings = await this.get(branchId);
    return settings.timezone;
  }

  async invalidate(branchId: string): Promise<void> {
    await this.cache.del(this.buildKey(branchId));
  }

  private buildKey(branchId: string) {
    return `branch_settings:${branchId}`;
  }
}
