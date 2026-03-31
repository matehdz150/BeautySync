import { BenefitRewardType, RedeemRewardInput } from './ types';

export interface BenefitRewardHandler {
  supports(type: BenefitRewardType): boolean;

  redeem(input: RedeemRewardInput): Promise<void>;
}
