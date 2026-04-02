// core/ports/tier-reward.repository.ts

import { TierReward, TierRewardType } from '../entities/tier-reward.entity';

export interface CreateTierRewardInput {
  tierId: string;
  type: TierRewardType;
  config: unknown;
}

export interface TierRewardsRepository {
  create(input: CreateTierRewardInput): Promise<TierReward>;

  getByTier(tierId: string): Promise<TierReward[]>;
}
