import { Global, Module } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { createBookingQueue } from './booking/booking.queue';

@Global()
@Module({
  providers: [
    {
      provide: 'BOOKING_QUEUE',
      inject: ['REDIS'],
      useFactory: (redis: Redis) => createBookingQueue(redis),
    },
  ],
  exports: ['BOOKING_QUEUE'],
})
export class QueuesModule {}
