import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { PaymentBenefitsCacheService } from './payment-benefits-cache.service';

@Injectable()
export class PaymentBenefitsRefreshService {
  constructor(
    @Inject('BENEFITS_QUEUE')
    private readonly queue: Queue,
    private readonly benefitsCache: PaymentBenefitsCacheService,
  ) {}

  async enqueueUserRefresh(input: { branchId: string; publicUserId: string }) {
    await this.queue.add(
      'refresh-benefits-snapshot',
      input,
      {
        jobId: `benefits-snapshot:${input.branchId}:${input.publicUserId}`,
        removeOnComplete: true,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }

  async invalidateUser(input: { branchId: string; publicUserId: string }) {
    await this.benefitsCache.invalidate(input);
  }

  async invalidateBranch(branchId: string) {
    await this.benefitsCache.invalidateBranch(branchId);
  }
}
