import { Queue } from 'bullmq';
import { db } from '../../../db/client';
import {
  benefitPrograms,
  benefitEarnRules,
  benefitPointsLedger,
  benefitUserBalance,
} from '../../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { redis } from '../../redis/redis.provider';
const benefitsQueue = new Queue('benefits-queue', {
  connection: redis,
});

export async function processPaymentBenefits(input: {
  bookingId: string;
  userId: string;
  branchId: string;
  amountCents: number;
  isOnline: boolean;
}) {
  console.log('💳 processPaymentBenefits', input);

  const program = await db.query.benefitPrograms.findFirst({
    where: eq(benefitPrograms.branchId, input.branchId),
  });

  if (!program || !program.isActive) return;

  const rules = await db.query.benefitEarnRules.findMany({
    where: eq(benefitEarnRules.programId, program.id),
  });

  for (const rule of rules) {
    // =========================
    // ONLINE PAYMENT
    // =========================
    if (rule.type === 'ONLINE_PAYMENT') {
      if (!input.isOnline) continue;

      const config = rule.config as { points: number };

      const idempotencyKey = `earn:online_payment:${rule.id}:${input.bookingId}:${input.userId}`;

      await db
        .insert(benefitPointsLedger)
        .values({
          userId: input.userId,
          branchId: input.branchId,
          points: config.points,
          source: 'EARN_RULE',
          referenceId: input.bookingId,
          idempotencyKey,
        })
        .onConflictDoNothing({
          target: benefitPointsLedger.idempotencyKey,
        });

      await db
        .insert(benefitUserBalance)
        .values({
          userId: input.userId,
          branchId: input.branchId,
          pointsBalance: config.points,
        })
        .onConflictDoUpdate({
          target: [benefitUserBalance.userId, benefitUserBalance.branchId],
          set: {
            pointsBalance: sql`${benefitUserBalance.pointsBalance} + ${config.points}`,
          },
        });
    }

    // =========================
    // SPEND ACCUMULATED
    // =========================
    if (rule.type === 'SPEND_ACCUMULATED') {
      const config = rule.config as {
        thresholdCents: number;
        points: number;
      };

      if (input.amountCents < config.thresholdCents) continue;

      const idempotencyKey = `earn:spend:${rule.id}:${input.bookingId}:${input.userId}`;

      await db
        .insert(benefitPointsLedger)
        .values({
          userId: input.userId,
          branchId: input.branchId,
          points: config.points,
          source: 'EARN_RULE',
          referenceId: input.bookingId,
          idempotencyKey,
        })
        .onConflictDoNothing({
          target: benefitPointsLedger.idempotencyKey,
        });

      await db
        .insert(benefitUserBalance)
        .values({
          userId: input.userId,
          branchId: input.branchId,
          pointsBalance: config.points,
        })
        .onConflictDoUpdate({
          target: [benefitUserBalance.userId, benefitUserBalance.branchId],
          set: {
            pointsBalance: sql`${benefitUserBalance.pointsBalance} + ${config.points}`,
          },
        });
    }
    await benefitsQueue.add('process-tier-progress', {
      userId: input.userId,
      branchId: input.branchId,
    });
  }
}
