/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { DateTime } from 'luxon';

@Injectable()
export class PublicBookingJobsService {
  constructor(@Inject('BOOKING_QUEUE') private queue: Queue) {}

  async scheduleBookingLifecycle(params: {
    bookingId: string;
    startsAtUtc: Date;
    endsAtUtc: Date;
  }) {
    const { bookingId, startsAtUtc, endsAtUtc } = params;

    const now = DateTime.now().toUTC();
    const start = DateTime.fromJSDate(startsAtUtc, { zone: 'utc' });
    const end = DateTime.fromJSDate(endsAtUtc, { zone: 'utc' });

    const delayMs = (when: DateTime) =>
      Math.max(0, when.diff(now).as('milliseconds'));

    const jid = (suffix: string) => `booking:${bookingId}:${suffix}`;

    // ✅ 0) confirmación inmediata
    await this.queue.add(
      'booking.confirmation',
      { bookingId },
      { jobId: jid('confirmation'), delay: 0 },
    );

    // ⏰ luego ya reminders
    await this.queue.add(
      'booking.reminder.24h',
      { bookingId },
      { jobId: jid('reminder24h'), delay: delayMs(start.minus({ hours: 24 })) },
    );

    await this.queue.add(
      'booking.reminder.2h',
      { bookingId },
      { jobId: jid('reminder2h'), delay: delayMs(start.minus({ hours: 2 })) },
    );

    await this.queue.add(
      'booking.reminder.30m',
      { bookingId },
      {
        jobId: jid('reminder30m'),
        delay: delayMs(start.minus({ minutes: 30 })),
      },
    );

    await this.queue.add(
      'booking.followup.5m_after',
      { bookingId },
      { jobId: jid('followup5m'), delay: delayMs(end.plus({ minutes: 5 })) },
    );

    await this.queue.add(
      'booking.markPast',
      { bookingId },
      { jobId: jid('markPast'), delay: delayMs(end.plus({ minutes: 1 })) },
    );
  }

  async cancelScheduledJobs(bookingId: string) {
    const suffixes = [
      'confirmation',
      'reminder24h',
      'reminder2h',
      'reminder30m',
      'followup5m',
      'markPast',
    ];

    for (const suffix of suffixes) {
      const jobId = `booking:${bookingId}:${suffix}`;

      try {
        await this.queue.remove(jobId);
      } catch {
        // job ya ejecutado o no existe → no pasa nada
      }
    }
  }

  async scheduleCancellationMail(params: {
    bookingId: string;
    cancelledBy: 'PUBLIC' | 'MANAGER';
  }) {
    const { bookingId, cancelledBy } = params;

    await this.queue.add(
      'booking.cancelled',
      { bookingId, cancelledBy },
      {
        jobId: `booking:${bookingId}:cancelled`,
        delay: 0,
      },
    );
  }

  async scheduleRescheduleMail(params: {
    bookingId: string;
    rescheduledBy: 'PUBLIC' | 'MANAGER' | 'SYSTEM';
    reason?: string;
    before: {
      startsAt: Date;
      endsAt: Date;
    };
    after: {
      startsAt: Date;
      endsAt: Date;
    };
  }) {
    const { bookingId, rescheduledBy, reason, before, after } = params;

    await this.queue.add(
      'booking.rescheduled',
      {
        bookingId,
        rescheduledBy,
        reason,
        before: {
          startsAt: before.startsAt.toISOString(),
          endsAt: before.endsAt.toISOString(),
        },
        after: {
          startsAt: after.startsAt.toISOString(),
          endsAt: after.endsAt.toISOString(),
        },
      },
      {
        jobId: `booking-${bookingId}-rescheduled-${randomUUID()}`,
        delay: 0,
        removeOnComplete: true,
      },
    );
  }
}
