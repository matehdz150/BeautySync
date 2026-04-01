import { Inject, Injectable } from '@nestjs/common';
import { DB } from 'src/modules/db/client';
import { BenefitRedemptionRepository } from '../../core/ports/benefit-redemption.repository';
import { benefitRewardRedemptions } from 'src/modules/db/schema/benefits/benefitRewardRedemptions';

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
        metadata: input.metadata,
      })
      .returning();

    return { id: row.id };
  }
}
