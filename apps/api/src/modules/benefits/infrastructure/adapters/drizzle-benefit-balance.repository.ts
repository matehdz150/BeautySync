import { Inject, Injectable } from '@nestjs/common';
import { BenefitBalanceRepository } from '../../core/ports/benefit-balance.repository';
import { DB } from '../../../db/client';
import { and, eq, gte, sql } from 'drizzle-orm';
import { benefitUserBalance } from '../../../db/schema';

@Injectable()
export class DrizzleBenefitBalanceRepository implements BenefitBalanceRepository {
  constructor(@Inject('DB') private readonly db: DB) {}

  async getByUserAndBranch(input: { userId: string; branchId: string }) {
    const row = await this.db.query.benefitUserBalance.findFirst({
      where: and(
        eq(benefitUserBalance.userId, input.userId),
        eq(benefitUserBalance.branchId, input.branchId),
      ),
    });

    return {
      pointsBalance: row?.pointsBalance ?? 0,
    };
  }

  async decrementIfEnough(input: {
    userId: string;
    branchId: string;
    points: number;
  }): Promise<boolean> {
    const result = await this.db
      .update(benefitUserBalance)
      .set({
        pointsBalance: sql`${benefitUserBalance.pointsBalance} - ${input.points}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(benefitUserBalance.userId, input.userId),
          eq(benefitUserBalance.branchId, input.branchId),
          gte(benefitUserBalance.pointsBalance, input.points),
        ),
      )
      .returning({ id: benefitUserBalance.id });

    return result.length > 0;
  }

  async getAllUserBalances(userId: string) {
    return this.db
      .select({
        branchId: benefitUserBalance.branchId,
        pointsBalance: benefitUserBalance.pointsBalance,
      })
      .from(benefitUserBalance)
      .where(eq(benefitUserBalance.userId, userId));
  }

  async getUsersByBranch(branchId: string) {
    return this.db
      .select({ userId: benefitUserBalance.userId })
      .from(benefitUserBalance)
      .where(eq(benefitUserBalance.branchId, branchId));
  }
}
