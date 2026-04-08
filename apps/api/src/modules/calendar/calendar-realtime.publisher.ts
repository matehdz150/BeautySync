import { Injectable } from '@nestjs/common';
import { redis } from '../queues/redis/redis.provider';

@Injectable()
export class CalendarRealtimePublisher {
  async emitInvalidate(params: { branchId: string; reason: string }) {
    const { branchId, reason } = params;
    if (!branchId) return;

    try {
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
