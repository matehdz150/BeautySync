import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DB } from '../../../db/client';
import { BenefitRedemptionRepository } from '../../core/ports/benefit-redemption.repository';
import { benefitRewardRedemptions } from '../../../db/schema';

@Injectable()
export class DrizzleBenefitRedemptionRepository implements BenefitRedemptionRepository {
  constructor(@Inject('DB') private readonly db: DB) {}

  async create(input: {
    rewardId: string;
    userId: string;
    branchId: string;
    pointsSpent: number;
    status: 'CONFIRMED' | 'PENDING';
    referenceCode: string;
    metadata?: Record<string, unknown>;
  }) {
    const [row] = await this.db
      .insert(benefitRewardRedemptions)
      .values({
        rewardId: input.rewardId,
        userId: input.userId,
        branchId: input.branchId,
        pointsSpent: input.pointsSpent,
        status: input.status,
        referenceCode: input.referenceCode,
        metadata: input.metadata ?? {},
      })
      .returning();

    return { id: row.id };
  }

  // =========================
  // UPDATE STATUS
  // =========================
  async updateStatus(
    id: string,
    status: 'CONFIRMED' | 'PENDING' | 'FAILED',
  ): Promise<void> {
    await this.db
      .update(benefitRewardRedemptions)
      .set({
        status,
      })
      .where(eq(benefitRewardRedemptions.id, id));
  }

  // =========================
  // UPDATE METADATA
  // =========================
  async updateMetadata(
    id: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.db
      .update(benefitRewardRedemptions)
      .set({
        metadata,
      })
      .where(eq(benefitRewardRedemptions.id, id));
  }

  // =========================
  // (OPCIONAL) IDEMPOTENCY
  // =========================
  async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<{ id: string } | null> {
    const row = await this.db.query.benefitRewardRedemptions.findFirst({
      where: (t, { sql }) =>
        sql`${t.metadata} ->> 'idempotencyKey' = ${idempotencyKey}`,
    });

    if (!row) return null;

    return { id: row.id };
  }
}
