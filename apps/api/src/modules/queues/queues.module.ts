import { Global, Module } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { createBookingQueue } from './booking/booking.queue';
import { createNotificationsQueue } from './notifications/notifications.queue';
import { createBenefitsQueue } from '../benefits/application/handlers/benefits.queue';

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
    {
      provide: 'BENEFITS_QUEUE',
      inject: ['REDIS'],
      useFactory: (redis: Redis) => createBenefitsQueue(redis),
    },
  ],
  exports: ['BOOKING_QUEUE', 'NOTIFICATIONS_QUEUE', 'BENEFITS_QUEUE'],
})
export class QueuesModule {}
