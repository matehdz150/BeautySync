import { Inject, Injectable } from '@nestjs/common';
import { redis } from '../queues/redis/redis.provider';
import { CACHE_PORT } from '../cache/core/ports/tokens';
import { CachePort } from '../cache/core/ports/cache.port';

@Injectable()
export class CalendarRealtimePublisher {
  constructor(
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async emitInvalidate(params: { branchId: string; reason: string }) {
    const { branchId, reason } = params;
    if (!branchId) return;

    try {
      await Promise.all([
        this.cache.delPattern(`calendar:day:${branchId}:*`),
        this.cache.delPattern(`calendar:week:${branchId}:*`),
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
