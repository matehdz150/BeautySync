import { Inject, Injectable } from '@nestjs/common';
import { ReviewCreatedEvent } from 'src/shared/domain-events/events';
import { Queue } from 'bullmq';

@Injectable()
export class ReviewCreatedHandler {
  constructor(
    @Inject('BENEFITS_QUEUE')
    private readonly queue: Queue,
  ) {}

  async handle(event: ReviewCreatedEvent) {
    const { payload } = event;
    console.log('🎯 HANDLER HIT', event);
    await this.queue.add('process-review-benefits', payload, {
      jobId: `${event.type}-${payload.reviewId}`,
      removeOnComplete: true,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}
