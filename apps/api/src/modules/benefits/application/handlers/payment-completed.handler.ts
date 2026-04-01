import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PaymentCompletedEvent } from 'src/shared/domain-events/events';

@Injectable()
export class PaymentCompletedHandler {
  constructor(
    @Inject('BENEFITS_QUEUE')
    private readonly queue: Queue,
  ) {}

  async handle(event: PaymentCompletedEvent) {
    const { payload } = event;

    await this.queue.add('process-payment-benefits', payload, {
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
