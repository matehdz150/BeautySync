// infrastructure/drizzle/drizzle-tier-rewards.repository.ts

import { Inject, Injectable } from '@nestjs/common';
import { DB, DbOrTx } from '../../../db//client';
import { eq } from 'drizzle-orm';

import { benefitTierRewards } from '../../../db/schema';

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
  constructor(@Inject('DB') private readonly db: DB) {}

  async create(input: CreateTierRewardInput, tx?: DbOrTx): Promise<TierReward> {
    const dbInstance = tx ?? this.db;

    const [row] = await dbInstance
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

  async getByTier(tierId: string, tx?: DbOrTx): Promise<TierReward[]> {
    const dbInstance = tx ?? this.db;

    const rows = await dbInstance
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

  async deleteByTier(tierId: string, tx?: DbOrTx) {
    const dbInstance = tx ?? this.db;

    await dbInstance
      .delete(benefitTierRewards)
      .where(eq(benefitTierRewards.tierId, tierId));
  }
}
