import { Inject, Injectable } from '@nestjs/common';
import { redis } from '../queues/redis/redis.provider';
import { CACHE_PORT } from '../cache/core/ports/tokens';
import { CachePort } from '../cache/core/ports/cache.port';
import { DateTime } from 'luxon';
import { CalendarSnapshotCacheService } from './calendar-snapshot-cache.service';

@Injectable()
export class CalendarRealtimePublisher {
  constructor(
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
    private readonly calendarSnapshot: CalendarSnapshotCacheService,
  ) {}

  async emitInvalidate(params: { branchId: string; reason: string; date?: string }) {
    const { branchId, reason, date } = params;
    if (!branchId) return;

    try {
      const normalizedDate = date
        ? DateTime.fromISO(date).toISODate()
        : null;

      await Promise.all([
        this.calendarSnapshot.invalidate({
          branchId,
          date: normalizedDate ?? undefined,
        }),
        normalizedDate
          ? this.cache.delPattern(
              `calendar:branch:${branchId}:day:${normalizedDate}:staff:*`,
            )
          : this.cache.delPattern(`calendar:branch:${branchId}:day:*`),
        this.cache.delPattern(`calendar:week:${branchId}:*`),
        this.cache.delPattern(`calendar:day:${branchId}:*`),
      ]);

      await redis.publish(
        'realtime.calendar',
        JSON.stringify({
          branchId,
          event: 'calendar.invalidate',
          data: {
            branchId,
            reason,
            at: new Date().toISOString(),
          },
        }),
      );
    } catch (error) {
      console.error('calendar realtime publish failed', error);
    }
  }
}
