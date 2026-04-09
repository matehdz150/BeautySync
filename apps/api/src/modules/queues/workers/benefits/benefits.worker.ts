import { Worker } from 'bullmq';
import { redis } from '../../redis/redis.provider';
import Redis from 'ioredis';

import { db } from '../../../db/client';

import { processBookingBenefits } from './process-booking-benefits';
import { processReviewBenefits } from './process-review-benefits';
import { processPaymentBenefits } from './process-payment-benefits';
import { processUserTierProgress } from '../../../benefits/core/services/process-user-tier-progress';

// repos
import { DrizzleBenefitBalanceRepository } from '../../../benefits/infrastructure/adapters/drizzle-benefit-balance.repository';
import { DrizzleBenefitProgramRepository } from '../../../benefits/infrastructure/adapters/drizzle-benefit-program.repository';
import { DrizzleBenefitTiersRepository } from '../../../benefits/infrastructure/adapters/drizzle-benefit-tiers.repository';
import { DrizzleTierRewardsRepository } from '../../../benefits/infrastructure/adapters/drizzle-tier-rewards.repository';
import { TierRewardGrantRepositoryDrizzle } from '../../../benefits/infrastructure/adapters/drizzle-tier-reward-grant.repository';

import { DrizzleGiftCardRepository } from '../../../gift-cards/infrastructure/adapters/drizzle-gift-card.repository';
import { DrizzleCouponRepository } from '../../../cupons/infrastructure/adapters/drizzle-coupon.repository';
import { DrizzlePaymentsRepository } from '../../../payments/infrastructure/adapters/payments-drizzle.repository';
import { trackJobMetric } from '../../../metrics/bullmq-metrics';
import {
  buildPaymentBenefitsSnapshotKey,
  mapPaymentBenefitsSnapshot,
  PAYMENT_BENEFITS_SNAPSHOT_TTL_SECONDS,
} from '../../../payments/application/payment-benefits-snapshot';

// =========================
// 🔥 INSTANCIAS
// =========================

// 👉 estos usan db
const balanceRepo = new DrizzleBenefitBalanceRepository(db);
const programRepo = new DrizzleBenefitProgramRepository(db);
const giftCardRepo = new DrizzleGiftCardRepository(db);

// 👉 estos NO usan db (según tu implementación actual)
const tiersRepo = new DrizzleBenefitTiersRepository(db);
const rewardsRepo = new DrizzleTierRewardsRepository(db);
const grantRepo = new TierRewardGrantRepositoryDrizzle();
const couponRepo = new DrizzleCouponRepository();
const paymentsRepo = new DrizzlePaymentsRepository(db);
const cacheRedis = new Redis({
  host: process.env.REDIS_CACHE_HOST || 'localhost',
  port: Number(process.env.REDIS_CACHE_PORT || 6380),
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

// =========================
// 🔥 TYPES
// =========================

type RecalculateTiersJob = {
  branchId: string;
};

type BookingBenefitsJob = {
  userId: string;
  branchId: string;
  bookingId: string;
  amountCents: number;
  isOnline: boolean;
  source?: string;
};

type ReviewBenefitsJob = {
  userId: string;
  branchId: string;
  reviewId: string;
};

type PaymentBenefitsJob = {
  bookingId: string; // 🔥 usa bookingId
  userId: string;
  branchId: string;
  amountCents: number;
  isOnline: boolean;
};

type TierProgressJob = {
  userId: string;
  branchId: string;
};

type RefreshBenefitsSnapshotJob = {
  userId: string;
  branchId: string;
};

// =========================
// 🔥 TYPE GUARDS
// =========================

function isRecalculateTiersJob(data: unknown): data is RecalculateTiersJob {
  if (!isObject(data)) return false;

  return typeof data.branchId === 'string';
}

function isObject(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null;
}

function isBookingBenefitsJob(data: unknown): data is BookingBenefitsJob {
  if (!isObject(data)) return false;

  return (
    typeof data.userId === 'string' &&
    typeof data.branchId === 'string' &&
    typeof data.bookingId === 'string' &&
    typeof data.amountCents === 'number' &&
    typeof data.isOnline === 'boolean'
  );
}

function isReviewBenefitsJob(data: unknown): data is ReviewBenefitsJob {
  if (!isObject(data)) return false;

  return (
    typeof data.userId === 'string' &&
    typeof data.branchId === 'string' &&
    typeof data.reviewId === 'string'
  );
}

function isPaymentBenefitsJob(data: unknown): data is PaymentBenefitsJob {
  if (!isObject(data)) return false;

  return (
    typeof data.userId === 'string' &&
    typeof data.branchId === 'string' &&
    typeof data.bookingId === 'string' && // ✅ FIX
    typeof data.amountCents === 'number' &&
    typeof data.isOnline === 'boolean'
  );
}

function isTierProgressJob(data: unknown): data is TierProgressJob {
  if (!isObject(data)) return false;

  return typeof data.userId === 'string' && typeof data.branchId === 'string';
}

function isRefreshBenefitsSnapshotJob(
  data: unknown,
): data is RefreshBenefitsSnapshotJob {
  if (!isObject(data)) return false;

  return typeof data.userId === 'string' && typeof data.branchId === 'string';
}

async function refreshBenefitsSnapshotCache(input: RefreshBenefitsSnapshotJob) {
  const raw = await paymentsRepo.getAvailableBenefits({
    branchId: input.branchId,
    publicUserId: input.userId,
  });

  const snapshot = mapPaymentBenefitsSnapshot({
    branchId: input.branchId,
    userId: input.userId,
    raw,
  });

  await cacheRedis.set(
    buildPaymentBenefitsSnapshotKey(input.branchId, input.userId),
    JSON.stringify(snapshot),
    'EX',
    PAYMENT_BENEFITS_SNAPSHOT_TTL_SECONDS,
  );
}

async function safeRefreshBenefitsSnapshotCache(input: RefreshBenefitsSnapshotJob) {
  try {
    await refreshBenefitsSnapshotCache(input);
  } catch (error) {
    console.error('[benefits snapshot refresh] failed', input, error);
  }
}

// =========================
// 🔥 HANDLER
// =========================

async function handler(name: string, data: unknown) {
  console.log('[benefits job]', name, data);

  switch (name) {
    case 'process-booking-benefits': {
      if (!isBookingBenefitsJob(data)) {
        throw new Error('Invalid booking benefits job payload');
      }

      await processBookingBenefits(data);
      await safeRefreshBenefitsSnapshotCache({
        branchId: data.branchId,
        userId: data.userId,
      });
      return;
    }

    case 'process-review-benefits': {
      if (!isReviewBenefitsJob(data)) {
        throw new Error('Invalid review benefits job payload');
      }

      await processReviewBenefits(data);
      await safeRefreshBenefitsSnapshotCache({
        branchId: data.branchId,
        userId: data.userId,
      });
      return;
    }

    case 'process-payment-benefits': {
      if (!isPaymentBenefitsJob(data)) {
        throw new Error('Invalid payment benefits job payload');
      }

      await processPaymentBenefits(data);
      await safeRefreshBenefitsSnapshotCache({
        branchId: data.branchId,
        userId: data.userId,
      });
      return;
    }

    case 'process-tier-progress': {
      if (!isTierProgressJob(data)) {
        throw new Error('Invalid tier progress job payload');
      }

      await processUserTierProgress({
        userId: data.userId,
        branchId: data.branchId,

        balanceRepo,
        programRepo,
        tiersRepo,
        rewardsRepo,
        grantRepo,
        giftCardRepo,
        couponRepo,
      });
      await safeRefreshBenefitsSnapshotCache({
        branchId: data.branchId,
        userId: data.userId,
      });
      return;
    }

    case 'refresh-benefits-snapshot': {
      if (!isRefreshBenefitsSnapshotJob(data)) {
        throw new Error('Invalid refresh benefits snapshot payload');
      }

      await refreshBenefitsSnapshotCache({
        branchId: data.branchId,
        userId: data.userId,
      });
      return;
    }

    case 'tiers.recalculate': {
      if (!isRecalculateTiersJob(data)) {
        throw new Error('Invalid recalculate tiers payload');
      }

      console.log('🔁 Recalculating tiers for branch:', data.branchId);

      // 🔥 1. obtener usuarios con balance
      const users = await balanceRepo.getUsersByBranch(data.branchId);

      console.log(`👥 Users to process: ${users.length}`);

      // 🔥 2. procesar en batch
      const chunkSize = 50;

      for (let i = 0; i < users.length; i += chunkSize) {
        const chunk = users.slice(i, i + chunkSize);

        await Promise.all(
          chunk.map((u) =>
            processUserTierProgress({
              userId: u.userId,
              branchId: data.branchId,

              balanceRepo,
              programRepo,
              tiersRepo,
              rewardsRepo,
              grantRepo,
              giftCardRepo,
              couponRepo,
            }),
          ),
        );
      }

      return;
    }

    default:
      console.warn('⚠️ Unhandled benefits job', name);
  }
}

// =========================
// 🔥 WORKER
// =========================

async function main() {
  console.log('🚀 benefits worker running...');

  const worker = new Worker(
    'benefits-queue',
    async (job) => trackJobMetric(job.name, () => handler(job.name, job.data)),
    {
      connection: redis,
      concurrency: 10,
    },
  );

  await worker.waitUntilReady();

  worker.on('completed', (job) => {
    console.log('✅ completed', job.name, job.id);
  });

  worker.on('failed', (job, err) => {
    console.error('❌ failed', job?.name, job?.id, err);
  });
}

main().catch(console.error);
