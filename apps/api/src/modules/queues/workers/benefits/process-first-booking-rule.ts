import { Queue } from 'bullmq';
import { db } from '../../../db/client';
import {
  benefitPointsLedger,
  benefitUserBalance,
  publicBookings,
} from '../../../db/schema';
import { eq, and, ne, sql } from 'drizzle-orm';
import { redis } from '../../redis/redis.provider';

const benefitsQueue = new Queue('benefits-queue', {
  connection: redis,
});

export async function processFirstBookingRule(params: {
  userId: string;
  branchId: string;
  rule: {
    id: string;
    config: {
      points: number;
    };
  };
  context: {
    bookingId: string;
  };
}) {
  const { userId, branchId, rule, context } = params;

  // =========================
  // 1. verificar si existe OTRO booking previo
  // =========================
  const existing = await db.query.publicBookings.findFirst({
    where: and(
      eq(publicBookings.publicUserId, userId),
      eq(publicBookings.branchId, branchId), // 🔥 importante
      ne(publicBookings.id, context.bookingId), // 🔥 excluir el actual
    ),
  });

  // 👉 si ya tiene otro booking → NO es first
  if (existing) return;

  // =========================
  // 2. idempotencia (CRÍTICO)
  // =========================
  const idempotencyKey = `earn:first_booking:${rule.id}:${context.bookingId}:${userId}`;

  // =========================
  // 3. ledger (historial)
  // =========================
  await db
    .insert(benefitPointsLedger)
    .values({
      userId,
      branchId,
      points: rule.config.points,
      source: 'EARN_RULE',
      referenceId: context.bookingId,
      idempotencyKey,
    })
    .onConflictDoNothing({
      target: benefitPointsLedger.idempotencyKey,
    });

  // =========================
  // 4. balance (cache)
  // =========================
  await db
    .insert(benefitUserBalance)
    .values({
      userId,
      branchId,
      pointsBalance: rule.config.points,
    })
    .onConflictDoUpdate({
      target: [benefitUserBalance.userId, benefitUserBalance.branchId],
      set: {
        pointsBalance: sql`${benefitUserBalance.pointsBalance} + ${rule.config.points}`,
      },
    });

  console.log('🎁 FIRST_BOOKING reward applied', {
    userId,
    bookingId: context.bookingId,
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
