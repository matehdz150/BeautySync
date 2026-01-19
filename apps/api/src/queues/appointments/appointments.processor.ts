import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';

import {
  APPOINTMENTS_JOBS,
  APPOINTMENTS_QUEUE,
} from './appointments-queue.constants';

type AppointmentJobPayload = {
  appointmentId: string;
  bookingId: string | null;
  publicUserId: string | null;
  branchId: string | null;
  startsAtIso: string;
};

@Injectable()
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
@Processor(APPOINTMENTS_QUEUE)
export class AppointmentsProcessor extends WorkerHost {
  private readonly logger = new Logger(AppointmentsProcessor.name);

  // 👇 aquí vas a inyectar tu AppointmentsService / MailService
  // constructor(private readonly appointmentsService: AppointmentsService) { super(); }

  // eslint-disable-next-line @typescript-eslint/require-await
  async process(job: Job<AppointmentJobPayload>) {
    const { appointmentId } = job.data;

    this.logger.log(`[JOB] ${job.name} appointmentId=${appointmentId}`);

    switch (job.name) {
      case APPOINTMENTS_JOBS.REMINDER_24H: {
        // TODO: send email reminder 24h
        // await this.mailService.sendAppointmentReminder({ appointmentId, type: "24H" })
        this.logger.log(`📩 Reminder 24h sent -> ${appointmentId}`);
        return;
      }

      case APPOINTMENTS_JOBS.REMINDER_2H: {
        // TODO: send email reminder 2h
        this.logger.log(`📩 Reminder 2h sent -> ${appointmentId}`);
        return;
      }

      case APPOINTMENTS_JOBS.REMINDER_5M: {
        // TODO: send email reminder 5m
        this.logger.log(`📩 Reminder 5m sent -> ${appointmentId}`);
        return;
      }

      case APPOINTMENTS_JOBS.FINALIZE_AFTER: {
        // TODO: update status to PAST / COMPLETED if time passed
        // await this.appointmentsService.markAsPast(appointmentId)
        this.logger.log(`✅ Finalized appointment -> ${appointmentId}`);
        return;
      }

      default:
        this.logger.warn(`Job desconocido: ${job.name}`);
        return;
    }
  }
}
