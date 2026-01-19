import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { AppointmentsQueueModule } from './appointments/appointments-queue.module';

@Module({
  imports: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD,
      },
    }),

    AppointmentsQueueModule,
  ],
})
export class QueuesModule {}
