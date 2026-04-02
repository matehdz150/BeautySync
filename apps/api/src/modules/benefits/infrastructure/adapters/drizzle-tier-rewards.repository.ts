// infrastructure/drizzle/drizzle-tier-rewards.repository.ts

import { Injectable } from '@nestjs/common';
import { db } from 'src/modules/db/client';
import { eq } from 'drizzle-orm';

import { benefitTierRewards } from 'src/modules/db/schema';

import {
  TierRewardsRepository,
  CreateTierRewardInput,
} from '../../core/ports/tier-reward.repository';

import {
  TierReward,
  TierRewardConfig,
} from '../../core/entities/tier-reward.entity';

@Injectable()
export class DrizzleTierRewardsRepository implements TierRewardsRepository {
  async create(input: CreateTierRewardInput): Promise<TierReward> {
    const [row] = await db
      .insert(benefitTierRewards)
      .values({
        tierId: input.tierId,
        type: input.type,
        config: input.config,
      })
      .returning();

    return {
      id: row.id,
      tierId: row.tierId,
      type: row.type,
      config: row.config as TierRewardConfig,
      createdAt: row.createdAt,
    };
  }

  async getByTier(tierId: string): Promise<TierReward[]> {
    const rows = await db
      .select()
      .from(benefitTierRewards)
      .where(eq(benefitTierRewards.tierId, tierId));

    return rows.map((row) => ({
      id: row.id,
      tierId: row.tierId,
      type: row.type,
      config: row.config as TierRewardConfig,
      createdAt: row.createdAt,
    }));
  }
}
