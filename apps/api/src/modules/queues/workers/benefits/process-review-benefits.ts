import { db } from '../../../db/client';
import {
  benefitPrograms,
  benefitEarnRules,
  benefitPointsLedger,
  benefitUserBalance,
} from '../../../db/schema';
import { eq, sql } from 'drizzle-orm';

export async function processReviewBenefits(input: {
  reviewId: string;
  userId: string;
  branchId: string;
}) {
  console.log('⭐ processReviewBenefits', input);

  const program = await db.query.benefitPrograms.findFirst({
    where: eq(benefitPrograms.branchId, input.branchId),
  });

  if (!program || !program.isActive) return;

  const rules = await db.query.benefitEarnRules.findMany({
    where: eq(benefitEarnRules.programId, program.id),
  });

  for (const rule of rules) {
    if (rule.type !== 'REVIEW_CREATED') continue;

    const config = rule.config as { points: number };

    const idempotencyKey = `earn:review:${rule.id}:${input.reviewId}:${input.userId}`;

    await db
      .insert(benefitPointsLedger)
      .values({
        userId: input.userId,
        branchId: input.branchId,
        points: config.points,
        source: 'EARN_RULE',
        referenceId: input.reviewId,
        idempotencyKey,
      })
      .onConflictDoNothing({
        target: benefitPointsLedger.idempotencyKey,
      });

    // 🔥 update balance
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
}
