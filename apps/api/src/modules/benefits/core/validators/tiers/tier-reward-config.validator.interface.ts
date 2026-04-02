// core/validators/tier-reward-config.validator.interface.ts

import { TierRewardConfig } from '../../entities/tier-reward.entity';

export interface TierRewardConfigValidator {
  supports(type: TierRewardConfig['type']): boolean;

  validate(config: unknown): TierRewardConfig;
}
