import { Global, Module } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { createBookingQueue } from './booking/booking.queue';
import { createNotificationsQueue } from './notifications/notifications.queue';

@Global()
@Module({
  providers: [
    {
      provide: 'BOOKING_QUEUE',
      inject: ['REDIS'],
      useFactory: (redis: Redis) => createBookingQueue(redis),
    },
    {
      provide: 'NOTIFICATIONS_QUEUE',
      inject: ['REDIS'],
      useFactory: (redis: Redis) => createNotificationsQueue(redis),
    },
  ],
  exports: ['BOOKING_QUEUE', 'NOTIFICATIONS_QUEUE'],
})
export class QueuesModule {}
