import { Inject, Injectable } from '@nestjs/common';
import { BenefitPointsRepository } from '../../core/ports/benefit-points.repository';
import { DB } from 'src/modules/db/client';
import { benefitPointsLedger, benefitUserBalance } from '../../../db/schema';
import { and, eq, gt, sql } from 'drizzle-orm';
import { benefitPointsSourceEnum } from '../../../db/schema';

export type BenefitPointsSource =
  (typeof benefitPointsSourceEnum.enumValues)[number];

@Injectable()
export class DrizzleBenefitPointsRepository implements BenefitPointsRepository {
  constructor(@Inject('DB') private readonly db: DB) {}

  async addPoints(params: {
    userId: string;
    branchId: string;
    points: number;
    source: BenefitPointsSource;
    referenceId?: string;
    idempotencyKey: string;
    metadata?: Record<string, unknown>;
    updateBalanceCache?: boolean;
  }): Promise<boolean> {
    // =========================
    // 1. INSERT LEDGER (IDEMPOTENTE)
    // =========================
    const inserted = await this.db
      .insert(benefitPointsLedger)
      .values({
        userId: params.userId,
        branchId: params.branchId,
        points: params.points,
        source: params.source,
        referenceId: params.referenceId,
        metadata: params.metadata,
        idempotencyKey: params.idempotencyKey,
      })
      .onConflictDoNothing({
        target: benefitPointsLedger.idempotencyKey,
      })
      .returning({ id: benefitPointsLedger.id });

    // =========================
    // 2. SI NO INSERTÓ → EXIT
    // =========================
    if (inserted.length === 0) {
      return false; // 🔥 ya procesado → NO tocar balance
    }

    if (params.updateBalanceCache === false) {
      return true;
    }

    // =========================
    // 3. UPDATE BALANCE (CACHE)
    // =========================
    await this.db
      .insert(benefitUserBalance)
      .values({
        userId: params.userId,
        branchId: params.branchId,
        pointsBalance: params.points,
      })
      .onConflictDoUpdate({
        target: [benefitUserBalance.userId, benefitUserBalance.branchId],
        set: {
          pointsBalance: sql`${benefitUserBalance.pointsBalance} + ${params.points}`,
          updatedAt: new Date(),
        },
      });

    return true;
  }

  async getTierPoints(params: {
    userId: string;
    branchId: string;
  }): Promise<number> {
    const [row] = await this.db
      .select({
        total: sql<number>`coalesce(sum(${benefitPointsLedger.points}), 0)`,
      })
      .from(benefitPointsLedger)
      .where(
        and(
          eq(benefitPointsLedger.userId, params.userId),
          eq(benefitPointsLedger.branchId, params.branchId),
          gt(benefitPointsLedger.points, 0),
        ),
      );

    return Number(row?.total ?? 0);
  }
}
