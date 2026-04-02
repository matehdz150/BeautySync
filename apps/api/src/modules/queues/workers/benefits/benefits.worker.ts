import { Worker } from 'bullmq';
import { redis } from '../../redis/redis.provider';

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

// =========================
// 🔥 TYPES
// =========================

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

// =========================
// 🔥 TYPE GUARDS
// =========================

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

      return processBookingBenefits(data);
    }

    case 'process-review-benefits': {
      if (!isReviewBenefitsJob(data)) {
        throw new Error('Invalid review benefits job payload');
      }

      return processReviewBenefits(data);
    }

    case 'process-payment-benefits': {
      if (!isPaymentBenefitsJob(data)) {
        throw new Error('Invalid payment benefits job payload');
      }

      return processPaymentBenefits(data);
    }

    case 'process-tier-progress': {
      if (!isTierProgressJob(data)) {
        throw new Error('Invalid tier progress job payload');
      }

      return processUserTierProgress({
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
    async (job) => handler(job.name, job.data),
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
