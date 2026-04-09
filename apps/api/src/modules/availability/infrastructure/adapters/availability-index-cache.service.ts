import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { REDIS_CACHE } from 'src/modules/cache/core/ports/tokens';
import { BranchServicesCacheService } from 'src/modules/cache/application/branch-services-cache.service';
import { BranchStaffCacheService } from 'src/modules/cache/application/branch-staff-cache.service';

import { AvailabilityIndex } from '../../core/entities/availability-index.entity';
import { BuildAvailabilitySnapshotUseCase } from '../../core/use-cases/build-availability-snapshot.use-case';
import { BuildAvailabilityIndexUseCase } from '../../core/use-cases/build-availability-index.use-case';
import { AvailabilityCacheService } from './availability-cache.service';
import { buildAvailabilityDaySnapshots } from './availability-day-snapshot.builder';

type GetOrBuildParams = {
  branchId: string;
  start: Date;
  end: Date;
};

@Injectable()
export class AvailabilityIndexCacheService {
  private static readonly LOCK_TTL_SECONDS = 10;
  private static readonly POLL_ATTEMPTS = 20;
  private static readonly POLL_INTERVAL_MS = 50;

  private readonly inflight = new Map<string, Promise<AvailabilityIndex>>();

  constructor(
    @Inject(REDIS_CACHE)
    private readonly redis: Redis,
    private readonly availabilityCache: AvailabilityCacheService,
    private readonly buildAvailabilitySnapshot: BuildAvailabilitySnapshotUseCase,
    private readonly buildAvailabilityIndex: BuildAvailabilityIndexUseCase,
    private readonly branchServicesCache: BranchServicesCacheService,
    private readonly branchStaffCache: BranchStaffCacheService,
  ) {}

  buildKey(params: { branchId: string; startDate: string; endDate: string }) {
    return this.availabilityCache.buildKey(params);
  }

  async getAvailabilityWindow(
    params: GetOrBuildParams,
  ): Promise<AvailabilityIndex> {
    return this.getOrBuild(params);
  }

  async getCached(params: GetOrBuildParams): Promise<AvailabilityIndex | null> {
    const key = this.availabilityCache.buildKey({
      branchId: params.branchId,
      startDate: this.normalizeDate(params.start),
      endDate: this.normalizeDate(params.end),
    });

    const cached = await this.availabilityCache.getIndex(key);
    if (cached && this.hasCompleteWindow(cached)) {
      console.log('[Availability] WINDOW CACHE HIT', key);
      return cached;
    }

    console.log('[Availability] WINDOW CACHE MISS', key);
    return null;
  }

  async getOrBuild(params: GetOrBuildParams): Promise<AvailabilityIndex> {
    const key = this.availabilityCache.buildKey({
      branchId: params.branchId,
      startDate: this.normalizeDate(params.start),
      endDate: this.normalizeDate(params.end),
    });

    const cached = await this.availabilityCache.getIndex(key);
    if (cached && this.hasCompleteWindow(cached)) {
      console.log('[Availability] WINDOW CACHE HIT', key);
      return cached;
    }

    const existing = this.inflight.get(key);
    if (existing) {
      console.log('[Availability] WINDOW INFLIGHT HIT', key);
      return existing;
    }

    console.log('[Availability] WINDOW CACHE MISS', key);

    let resolvePromise!: (value: AvailabilityIndex) => void;
    let rejectPromise!: (reason?: unknown) => void;
    const promise = new Promise<AvailabilityIndex>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    this.inflight.set(key, promise);

    try {
      const result = await this.buildWithLock(key, params);
      resolvePromise(result);
      return result;
    } catch (error) {
      rejectPromise(error);
      throw error;
    } finally {
      if (this.inflight.get(key) === promise) {
        this.inflight.delete(key);
      }
    }
  }

  private async buildWithLock(
    key: string,
    params: GetOrBuildParams,
  ): Promise<AvailabilityIndex> {
    const lockKey = `availability:window:lock:${key}`;
    const lockId = randomUUID();
    let acquiredLock = false;

    try {
      acquiredLock = await this.tryAcquireLock(lockKey, lockId);

      if (!acquiredLock) {
        const cached = await this.waitForCache(key);
        if (cached) {
          return cached;
        }

        acquiredLock = await this.tryAcquireLock(lockKey, lockId);
      }

      const cached = await this.availabilityCache.getIndex(key);
      if (cached && this.hasCompleteWindow(cached)) {
        return cached;
      }

      const snapshot = await this.buildAvailabilitySnapshot.execute({
        branchId: params.branchId,
        start: params.start,
        end: params.end,
        dayOfWeeks: [0, 1, 2, 3, 4, 5, 6],
      });

      const index = this.buildAvailabilityIndex.execute({
        snapshot,
        start: params.start,
        end: params.end,
      });

      const [services, staffRows] = await Promise.all([
        this.branchServicesCache.getActive(params.branchId),
        this.branchStaffCache.getByBranch(params.branchId),
      ]);
      const hydratedIndex: AvailabilityIndex = {
        ...index,
        daySnapshots: buildAvailabilityDaySnapshots({
          branchId: params.branchId,
          index,
          services,
          staffRows,
        }),
      };

      await this.availabilityCache.setIndex(key, hydratedIndex);
      return hydratedIndex;
    } finally {
      if (acquiredLock) {
        await this.releaseLock(lockKey, lockId);
      }
    }
  }

  private async tryAcquireLock(lockKey: string, lockId: string) {
    const result = await this.redis.set(
      lockKey,
      lockId,
      'EX',
      AvailabilityIndexCacheService.LOCK_TTL_SECONDS,
      'NX',
    );

    return result === 'OK';
  }

  private async waitForCache(key: string) {
    for (
      let attempt = 0;
      attempt < AvailabilityIndexCacheService.POLL_ATTEMPTS;
      attempt += 1
    ) {
      await this.sleep(AvailabilityIndexCacheService.POLL_INTERVAL_MS);
      const cached = await this.availabilityCache.getIndex(key);
      if (cached && this.hasCompleteWindow(cached)) {
        return cached;
      }
    }

    return null;
  }

  private async releaseLock(lockKey: string, lockId: string) {
    const current = await this.redis.get(lockKey);
    if (current === lockId) {
      await this.redis.del(lockKey);
    }
  }

  private async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private hasCompleteWindow(index: AvailabilityIndex) {
    return index.daySnapshots.size > 0;
  }

  private normalizeDate(date: Date) {
    return date.toISOString().slice(0, 10);
  }
}
