/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
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
}
