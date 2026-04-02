// core/ports/tier-reward.repository.ts

import { DbOrTx } from 'src/modules/db/client';
import { TierReward, TierRewardType } from '../entities/tier-reward.entity';

export interface CreateTierRewardInput {
  tierId: string;
  type: TierRewardType;
  config: unknown;
}

export interface TierRewardsRepository {
  create(input: CreateTierRewardInput, tx?: DbOrTx): Promise<TierReward>;

  getByTier(tierId: string, tx?: DbOrTx): Promise<TierReward[]>;
}
