import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { BookingCreatedEvent } from 'src/shared/domain-events/events';

@Injectable()
export class BookingCreatedHandler {
  constructor(
    @Inject('BENEFITS_QUEUE')
    private readonly queue: Queue,
  ) {}

  async handle(event: BookingCreatedEvent) {
    const { payload } = event;

    await this.queue.add('process-booking-benefits', payload, {
      jobId: `${event.type}-${payload.bookingId}`,
      removeOnComplete: true,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}
