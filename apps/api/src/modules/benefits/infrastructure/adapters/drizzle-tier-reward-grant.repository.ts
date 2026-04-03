import { eq, and } from 'drizzle-orm';
import { userTierRewardsGranted } from '../../../db/schema';
import { TierRewardGrantRepository } from '../../core/ports/tier-reward-grant.repository';
import { db } from '../../../db/client';

export class TierRewardGrantRepositoryDrizzle implements TierRewardGrantRepository {
  async exists(input: {
    userId: string;
    branchId: string;
    tierRewardId: string;
  }): Promise<boolean> {
    const row = await db.query.userTierRewardsGranted.findFirst({
      where: and(
        eq(userTierRewardsGranted.userId, input.userId),
        eq(userTierRewardsGranted.branchId, input.branchId),
        eq(userTierRewardsGranted.tierRewardId, input.tierRewardId),
      ),
    });

    return !!row;
  }

  async create(input: {
    userId: string;
    branchId: string;
    tierRewardId: string;
  }) {
    await db.insert(userTierRewardsGranted).values(input);
  }
}
