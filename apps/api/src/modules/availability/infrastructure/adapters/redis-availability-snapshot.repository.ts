import { Inject, Injectable } from '@nestjs/common';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import { CachePort } from 'src/modules/cache/core/ports/cache.port';

import { AvailabilityDaySnapshot } from '../../core/entities/availability-day-snapshot.entity';
import { AvailabilitySnapshotRepository } from '../../core/ports/availability-snapshot.repository';

@Injectable()
export class RedisAvailabilitySnapshotRepository implements AvailabilitySnapshotRepository {
  private static readonly TTL_SECONDS = 600;

  constructor(
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async get(
    branchId: string,
    date: string,
  ): Promise<AvailabilityDaySnapshot | null> {
    const primary = await this.cache.get<AvailabilityDaySnapshot>(
      this.buildKey(branchId, date),
    );
    if (primary) {
      return primary;
    }

    return this.cache.get<AvailabilityDaySnapshot>(
      this.buildLegacyKey(branchId, date),
    );
  }

  async set(snapshot: AvailabilityDaySnapshot): Promise<void> {
    await this.cache.set(
      this.buildKey(snapshot.branchId, snapshot.date),
      snapshot,
      RedisAvailabilitySnapshotRepository.TTL_SECONDS,
    );
  }

  async invalidate(branchId: string, date?: string): Promise<void> {
    if (date) {
      await Promise.all([
        this.cache.del(this.buildKey(branchId, date)),
        this.cache.del(this.buildLegacyKey(branchId, date)),
      ]);
      return;
    }

    await Promise.all([
      this.cache.delPattern(`availability:${branchId}:????-??-??`),
      this.cache.delPattern(`availability:branch:${branchId}:day:*`),
    ]);
  }

  buildKey(branchId: string, date: string) {
    return `availability:${branchId}:${date}`;
  }

  private buildLegacyKey(branchId: string, date: string) {
    return `availability:branch:${branchId}:day:${date}`;
  }
}
