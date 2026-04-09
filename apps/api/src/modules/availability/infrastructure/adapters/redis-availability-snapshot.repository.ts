import { Inject, Injectable } from '@nestjs/common';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import { CachePort } from 'src/modules/cache/core/ports/cache.port';

import { AvailabilityDaySnapshot } from '../../core/entities/availability-day-snapshot.entity';
import { AvailabilitySnapshotRepository } from '../../core/ports/availability-snapshot.repository';

@Injectable()
export class RedisAvailabilitySnapshotRepository
  implements AvailabilitySnapshotRepository
{
  private static readonly TTL_SECONDS = 600;

  constructor(
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async get(
    branchId: string,
    date: string,
  ): Promise<AvailabilityDaySnapshot | null> {
    return this.cache.get<AvailabilityDaySnapshot>(this.buildKey(branchId, date));
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
      await this.cache.del(this.buildKey(branchId, date));
      return;
    }

    await this.cache.delPattern(`availability:${branchId}:*`);
  }

  buildKey(branchId: string, date: string) {
    return `availability:${branchId}:${date}`;
  }
}
