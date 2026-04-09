import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { REDIS_CACHE } from 'src/modules/cache/core/ports/tokens';

import { CalendarDaySnapshot } from '../core/entities/calendar-day-snapshot.entity';
import { CalendarSnapshotRepository } from '../core/ports/calendar-snapshot.repository';

@Injectable()
export class RedisCalendarSnapshotRepository implements CalendarSnapshotRepository {
  constructor(
    @Inject(REDIS_CACHE)
    private readonly redis: Redis,
  ) {}

  async get(params: { branchId: string; date: string }) {
    const raw = await this.redis.get(this.buildKey(params));
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as CalendarDaySnapshot;
  }

  async set(snapshot: CalendarDaySnapshot) {
    await this.redis.set(
      this.buildKey({
        branchId: snapshot.branchId,
        date: snapshot.date,
      }),
      JSON.stringify(snapshot),
    );
  }

  async invalidate(params: { branchId: string; date?: string }) {
    if (params.date) {
      await this.redis.del(
        this.buildKey({
          branchId: params.branchId,
          date: params.date,
        }),
      );
      return;
    }

    const keys = await this.redis.keys(
      `calendar:branch:${params.branchId}:date:*`,
    );
    if (keys.length) {
      await this.redis.del(...keys);
    }
  }

  private buildKey(params: { branchId: string; date: string }) {
    return `calendar:branch:${params.branchId}:date:${params.date}`;
  }
}
