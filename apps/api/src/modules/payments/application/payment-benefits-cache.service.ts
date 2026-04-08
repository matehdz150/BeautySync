import { Inject, Injectable } from '@nestjs/common';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import { CachePort } from 'src/modules/cache/core/ports/cache.port';
import { requestContext } from 'src/modules/metrics/request-context';

import { PAYMENTS_REPOSITORY } from '../core/ports/tokens';
import { PaymentsRepositoryPort } from '../core/ports/payment.repository';

type AvailableBenefitsSnapshot = Awaited<
  ReturnType<PaymentsRepositoryPort['getAvailableBenefits']>
>;

@Injectable()
export class PaymentBenefitsCacheService {
  private static readonly TTL_SECONDS = 20;

  constructor(
    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepo: PaymentsRepositoryPort,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async get(input: {
    branchId: string;
    publicUserId: string;
  }): Promise<AvailableBenefitsSnapshot> {
    const key = this.buildKey(input.publicUserId, input.branchId);

    return requestContext.getOrSet(`payment_benefits:${key}`, async () => {
      const cached = await this.cache.get<AvailableBenefitsSnapshot>(key);
      if (cached) {
        return cached;
      }

      const snapshot = await this.paymentsRepo.getAvailableBenefits(input);
      await this.cache.set(key, snapshot, PaymentBenefitsCacheService.TTL_SECONDS);
      return snapshot;
    });
  }

  async invalidate(input: { branchId: string; publicUserId: string }) {
    await this.cache.del(this.buildKey(input.publicUserId, input.branchId));
  }

  private buildKey(publicUserId: string, branchId: string) {
    return `benefits:${publicUserId}:${branchId}`;
  }
}
