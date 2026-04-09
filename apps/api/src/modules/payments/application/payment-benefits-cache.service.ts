import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';

import {
  CACHE_PORT,
  REDIS_CACHE,
} from 'src/modules/cache/core/ports/tokens';
import { CachePort } from 'src/modules/cache/core/ports/cache.port';
import { requestContext } from 'src/modules/metrics/request-context';

import { PAYMENTS_REPOSITORY } from '../core/ports/tokens';
import { PaymentsRepositoryPort } from '../core/ports/payment.repository';
import {
  buildPaymentBenefitsSnapshotKey,
  buildPaymentBenefitsSnapshotPattern,
  mapPaymentBenefitsSnapshot,
  PAYMENT_BENEFITS_SNAPSHOT_TTL_SECONDS,
  PaymentBenefitsSnapshot,
} from './payment-benefits-snapshot';

@Injectable()
export class PaymentBenefitsCacheService {
  private static readonly LOCK_TTL_SECONDS = 10;
  private static readonly POLL_ATTEMPTS = 20;
  private static readonly POLL_INTERVAL_MS = 50;

  private readonly inflight = new Map<string, Promise<PaymentBenefitsSnapshot>>();

  constructor(
    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepo: PaymentsRepositoryPort,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
    @Inject(REDIS_CACHE)
    private readonly redis: Redis,
  ) {}

  async get(input: {
    branchId: string;
    publicUserId: string;
  }): Promise<PaymentBenefitsSnapshot> {
    const key = buildPaymentBenefitsSnapshotKey(
      input.branchId,
      input.publicUserId,
    );

    return requestContext.getOrSet(`payment_benefits:${key}`, async () => {
      const cached = await this.read(key);
      if (cached) {
        return cached;
      }

      const existing = this.inflight.get(key);
      if (existing) {
        return existing;
      }

      const promise = this.rebuild(input);
      this.inflight.set(key, promise);

      try {
        return await promise;
      } finally {
        if (this.inflight.get(key) === promise) {
          this.inflight.delete(key);
        }
      }
    });
  }

  async rebuild(input: {
    branchId: string;
    publicUserId: string;
  }): Promise<PaymentBenefitsSnapshot> {
    const key = buildPaymentBenefitsSnapshotKey(
      input.branchId,
      input.publicUserId,
    );
    const lockKey = `${key}:lock`;
    const lockId = randomUUID();
    let acquiredLock = false;

    try {
      acquiredLock = await this.tryAcquireLock(lockKey, lockId);

      if (!acquiredLock) {
        const cached = await this.waitForSnapshot(key);
        if (cached) {
          return cached;
        }

        acquiredLock = await this.tryAcquireLock(lockKey, lockId);
      }

      const cached = await this.read(key);
      if (cached) {
        return cached;
      }

      const raw = await this.paymentsRepo.getAvailableBenefits(input);
      const snapshot = mapPaymentBenefitsSnapshot({
        branchId: input.branchId,
        userId: input.publicUserId,
        raw,
      });

      await this.cache.set(key, snapshot, PAYMENT_BENEFITS_SNAPSHOT_TTL_SECONDS);
      return snapshot;
    } finally {
      if (acquiredLock) {
        await this.releaseLock(lockKey, lockId);
      }
    }
  }

  async invalidate(input: { branchId: string; publicUserId: string }) {
    await this.cache.del(
      buildPaymentBenefitsSnapshotKey(input.branchId, input.publicUserId),
    );
  }

  async invalidateBranch(branchId: string) {
    await this.cache.delPattern(buildPaymentBenefitsSnapshotPattern(branchId));
  }

  private async read(key: string): Promise<PaymentBenefitsSnapshot | null> {
    return this.cache.get<PaymentBenefitsSnapshot>(key);
  }

  private async tryAcquireLock(lockKey: string, lockId: string) {
    const result = await this.redis.set(
      lockKey,
      lockId,
      'EX',
      PaymentBenefitsCacheService.LOCK_TTL_SECONDS,
      'NX',
    );

    return result === 'OK';
  }

  private async waitForSnapshot(key: string) {
    for (
      let attempt = 0;
      attempt < PaymentBenefitsCacheService.POLL_ATTEMPTS;
      attempt += 1
    ) {
      await new Promise((resolve) =>
        setTimeout(resolve, PaymentBenefitsCacheService.POLL_INTERVAL_MS),
      );

      const cached = await this.read(key);
      if (cached) {
        return cached;
      }
    }

    return null;
  }

  private async releaseLock(lockKey: string, lockId: string) {
    const current = await this.redis.get(lockKey);
    if (current === lockId) {
      await this.redis.del(lockKey);
    }
  }
}
