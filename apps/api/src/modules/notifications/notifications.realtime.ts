/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { redis } from '../queues/redis/redis.provider';
import { NotificationsSseService } from './notifications-sse.service';

@Injectable()
export class NotificationsRealtimeBridge implements OnModuleInit {
  constructor(private readonly sse: NotificationsSseService) {}

  async onModuleInit() {
    const sub = redis.duplicate();

    await sub.subscribe('realtime.notifications');

    console.log('📡 Redis realtime bridge ready');

    sub.on('message', (channel: string, message: string) => {
      if (channel !== 'realtime.notifications') return;

      try {
        const evt = JSON.parse(message);

        if (!evt?.branchId || !evt?.event) return;

        console.log('📨 REDIS EVENT', evt.event, evt.branchId);

        this.sse.emitToBranch(evt.branchId, {
          event: evt.event,
          data: evt.data ?? {},
        });
      } catch {
        console.error('❌ invalid realtime event', message);
      }
    });
  }
}
