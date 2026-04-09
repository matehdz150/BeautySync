import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import Redis from 'ioredis';

import { REDIS_CACHE } from 'src/modules/cache/core/ports/tokens';

import { AvailabilityServicesSnapshot } from '../../core/entities/availability-services-snapshot.entity';
import { AvailabilityServicesRepository } from '../../core/ports/availability-services.repository';
import { AvailabilitySnapshotRepository } from '../../core/ports/availability-snapshot.repository';
import { AVAILABILITY_SNAPSHOT_REPOSITORY } from '../../core/ports/tokens';
import { AvailabilityIndexCacheService } from './availability-index-cache.service';
import {
  buildAvailabilityServicesSnapshot,
  availabilityServicesSnapshotTiming,
} from './availability-services-snapshot.builder';
import { getAvailabilityWindowForDate } from './availability-window.helpers';

@Injectable()
export class RedisAvailabilityServicesRepository implements AvailabilityServicesRepository {
  private static readonly TTL_SECONDS = 600;
  private readonly inflight = new Map<
    string,
    Promise<AvailabilityServicesSnapshot>
  >();

  constructor(
    @Inject(REDIS_CACHE)
    private readonly redis: Redis,
    @Inject(AVAILABILITY_SNAPSHOT_REPOSITORY)
    private readonly snapshots: AvailabilitySnapshotRepository,
    private readonly availabilityIndexCache: AvailabilityIndexCacheService,
  ) {}

  async get(
    branchId: string,
    date: string,
  ): Promise<AvailabilityServicesSnapshot | null> {
    const raw = await this.redis.get(this.buildKey(branchId, date));
    if (!raw) {
      return null;
    }

    const snapshot = JSON.parse(raw) as AvailabilityServicesSnapshot;
    return this.normalizeSnapshot(snapshot);
  }

  async set(snapshot: AvailabilityServicesSnapshot): Promise<void> {
    await this.redis.set(
      this.buildKey(snapshot.branchId, snapshot.date),
      JSON.stringify(snapshot),
      'EX',
      RedisAvailabilityServicesRepository.TTL_SECONDS,
    );
  }

  async buildFromSnapshot(
    branchId: string,
    date: string,
  ): Promise<AvailabilityServicesSnapshot> {
    const key = this.buildKey(branchId, date);
    const inflight = this.inflight.get(key);
    if (inflight) {
      return inflight;
    }

    const promise = (async () => {
      let daySnapshot = await this.snapshots.get(branchId, date);
      if (!daySnapshot) {
        const window = getAvailabilityWindowForDate(date);
        const index = await this.availabilityIndexCache.getAvailabilityWindow({
          branchId,
          start: window.start.toUTC().toJSDate(),
          end: window.end.toUTC().toJSDate(),
        });

        daySnapshot = index.daySnapshots.get(date) ?? null;
      }

      if (!daySnapshot) {
        throw new ServiceUnavailableException(
          'AVAILABILITY_SNAPSHOT_NOT_READY',
        );
      }

      console.log(
        '[AvailabilityServices] BUILD FROM SNAPSHOT ONLY',
        branchId,
        date,
      );
      const servicesSnapshot = buildAvailabilityServicesSnapshot(daySnapshot);
      await this.set(servicesSnapshot);
      return servicesSnapshot;
    })();

    this.inflight.set(key, promise);

    try {
      return await promise;
    } finally {
      if (this.inflight.get(key) === promise) {
        this.inflight.delete(key);
      }
    }
  }

  async invalidate(branchId: string, date?: string): Promise<void> {
    if (date) {
      await this.redis.del(this.buildKey(branchId, date));
      return;
    }

    const stream = this.redis.scanStream({
      match: `availability:services:${branchId}:*`,
      count: 100,
    });

    for await (const keys of stream) {
      const batch = keys as string[];
      if (batch.length) {
        await this.redis.del(...batch);
      }
    }
  }

  buildKey(branchId: string, date: string) {
    return `availability:services:${branchId}:${date}`;
  }

  private normalizeSnapshot(
    snapshot: AvailabilityServicesSnapshot,
  ): AvailabilityServicesSnapshot {
    const generatedAtMs = new Date(snapshot.generatedAt).getTime();
    const generatedAt = Number.isFinite(generatedAtMs)
      ? generatedAtMs
      : Date.now();

    return {
      ...snapshot,
      staleAt:
        snapshot.staleAt ??
        new Date(
          generatedAt +
            availabilityServicesSnapshotTiming.staleAfterSeconds * 1000,
        ).toISOString(),
      expiresAt:
        snapshot.expiresAt ??
        new Date(
          generatedAt +
            availabilityServicesSnapshotTiming.expireAfterSeconds * 1000,
        ).toISOString(),
    };
  }
}
