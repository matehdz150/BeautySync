import { Injectable, OnModuleInit } from '@nestjs/common';
import { redis } from '../queues/redis/redis.provider';
import { CalendarSseService } from './calendar-sse.service';

@Injectable()
export class CalendarRealtimeBridge implements OnModuleInit {
  constructor(private readonly sse: CalendarSseService) {}

  async onModuleInit() {
    const sub = redis.duplicate();

    await sub.subscribe('realtime.calendar');

    sub.on('message', (channel: string, message: string) => {
      if (channel !== 'realtime.calendar') return;

      try {
        const evt = JSON.parse(message) as {
          branchId?: string;
          event?: string;
          data?: unknown;
        };

        if (!evt?.branchId || !evt?.event) return;

        this.sse.emitToBranch(evt.branchId, {
          event: evt.event,
          data: evt.data ?? {},
        });
      } catch {
        console.error('invalid calendar realtime event', message);
      }
    });
  }
}
