import { Queue } from 'bullmq';
import { db } from '../../../db/client';
import {
  benefitUserProgress,
  benefitPointsLedger,
  benefitUserBalance,
} from '../../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { redis } from '../../redis/redis.provider';

const benefitsQueue = new Queue('benefits-queue', {
  connection: redis,
});

export async function processBookingCountRule(params: {
  userId: string;
  branchId: string;
  rule: {
    id: string;
    config: {
      count: number;
      points: number;
    };
  };
  context: {
    bookingId: string;
  };
}) {
  const { userId, branchId, rule, context } = params;

  const { count, points } = rule.config;

  // =========================
  // 1. obtener progreso actual
  // =========================
  const progressRow = await db.query.benefitUserProgress.findFirst({
    where: and(
      eq(benefitUserProgress.userId, userId),
      eq(benefitUserProgress.ruleId, rule.id),
    ),
  });

  const current = progressRow?.progressValue ?? 0;
  const newValue = current + 1;

  // =========================
  // 2. si cumple threshold
  // =========================
  if (newValue >= count) {
    const idempotencyKey = `earn:booking_count:${rule.id}:${context.bookingId}:${userId}`;

    // 🔥 ledger
    await db
      .insert(benefitPointsLedger)
      .values({
        userId,
        branchId,
        points,
        source: 'EARN_RULE',
        referenceId: context.bookingId,
        idempotencyKey,
      })
      .onConflictDoNothing({
        target: benefitPointsLedger.idempotencyKey,
      });

    // 🔥 balance
    await db
      .insert(benefitUserBalance)
      .values({
        userId,
        branchId,
        pointsBalance: points,
      })
      .onConflictDoUpdate({
        target: [benefitUserBalance.userId, benefitUserBalance.branchId],
        set: {
          pointsBalance: sql`${benefitUserBalance.pointsBalance} + ${points}`,
        },
      });

    // 🔥 reset progreso
    await db
      .insert(benefitUserProgress)
      .values({
        userId,
        ruleId: rule.id,
        progressValue: 0,
      })
      .onConflictDoUpdate({
        target: [benefitUserProgress.userId, benefitUserProgress.ruleId],
        set: {
          progressValue: 0,
          updatedAt: new Date(),
        },
      });

    return;
  }

  // =========================
  // 3. si NO cumple → incrementar
  // =========================
  await db
    .insert(benefitUserProgress)
    .values({
      userId,
      ruleId: rule.id,
      progressValue: newValue,
    })
    .onConflictDoUpdate({
      target: [benefitUserProgress.userId, benefitUserProgress.ruleId],
      set: {
        progressValue: newValue,
        updatedAt: new Date(),
      },
    });

  await benefitsQueue.add(
    'process-tier-progress',
    {
      userId,
      branchId,
    },
    {
      jobId: `tier-progress-${context.bookingId}`, // idempotente
    },
  );
}
