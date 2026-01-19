import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import {
  APPOINTMENTS_JOBS,
  APPOINTMENTS_QUEUE,
} from './appointments-queue.constants';

type ScheduleAppointmentJobsInput = {
  appointmentId: string;
  bookingId?: string;
  startsAtIso: string; // ISO real UTC
  endsAtIso?: string;
  publicUserId?: string;
  branchId?: string;
};

@Injectable()
export class AppointmentsSchedulerService {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    @InjectQueue(APPOINTMENTS_QUEUE)
    private readonly queue: Queue,
  ) {}

  async scheduleAppointmentJobs(input: ScheduleAppointmentJobsInput) {
    const startsAt = new Date(input.startsAtIso).getTime();

    if (!Number.isFinite(startsAt)) {
      throw new Error('startsAtIso inválido para scheduleAppointmentJobs()');
    }

    const now = Date.now();

    const reminder24hAt = startsAt - 24 * 60 * 60 * 1000;
    const reminder2hAt = startsAt - 2 * 60 * 60 * 1000;
    const reminder5mAt = startsAt - 5 * 60 * 1000;
    const finalizeAt = startsAt + 5 * 60 * 1000; // 👈 5 mins después de iniciar

    // helper: si ya pasó, no lo programes
    const safeDelay = (whenMs: number) => Math.max(0, whenMs - now);

    const baseData = {
      appointmentId: input.appointmentId,
      bookingId: input.bookingId ?? null,
      publicUserId: input.publicUserId ?? null,
      branchId: input.branchId ?? null,
      startsAtIso: input.startsAtIso,
    };

    // ⚠️ jobId estable para NO duplicar jobs si reintentas confirmación
    const jobId = (suffix: string) =>
      `appointment:${input.appointmentId}:${suffix}`;

    const jobs = [
      {
        name: APPOINTMENTS_JOBS.REMINDER_24H,
        id: jobId('reminder24h'),
        runAt: reminder24hAt,
        delay: safeDelay(reminder24hAt),
      },
      {
        name: APPOINTMENTS_JOBS.REMINDER_2H,
        id: jobId('reminder2h'),
        runAt: reminder2hAt,
        delay: safeDelay(reminder2hAt),
      },
      {
        name: APPOINTMENTS_JOBS.REMINDER_5M,
        id: jobId('reminder5m'),
        runAt: reminder5mAt,
        delay: safeDelay(reminder5mAt),
      },
      {
        name: APPOINTMENTS_JOBS.FINALIZE_AFTER,
        id: jobId('finalize'),
        runAt: finalizeAt,
        delay: safeDelay(finalizeAt),
      },
    ];

    // No programes recordatorios en el pasado
    const filtered = jobs.filter((j) => j.runAt > now);

    await Promise.all(
      filtered.map((j) =>
        this.queue.add(j.name, baseData, {
          jobId: j.id,
          delay: j.delay,
          attempts: 5,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        }),
      ),
    );

    return {
      scheduled: filtered.map((x) => ({
        name: x.name,
        jobId: x.id,
        delayMs: x.delay,
      })),
    };
  }
}
