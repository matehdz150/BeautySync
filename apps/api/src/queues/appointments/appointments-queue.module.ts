import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { APPOINTMENTS_QUEUE } from './appointments-queue.constants';
import { AppointmentsSchedulerService } from './appointments.service';
import { AppointmentsProcessor } from './appointments.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: APPOINTMENTS_QUEUE,
    }),
  ],
  providers: [AppointmentsSchedulerService, AppointmentsProcessor],
  exports: [AppointmentsSchedulerService],
})
export class AppointmentsQueueModule {}
