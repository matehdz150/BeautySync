import { Inject, Injectable } from '@nestjs/common';
import { BENEFIT_REWARD_HANDLERS } from '../ports/tokens';
import { BenefitRewardHandler } from './benefit-reward-handler.interface';
import { RedeemRewardInput } from './types';

@Injectable()
export class BenefitRewardEngine {
  constructor(
    @Inject(BENEFIT_REWARD_HANDLERS)
    private readonly handlers: BenefitRewardHandler[],
  ) {}

  async redeem(input: RedeemRewardInput) {
    const handler = this.handlers.find((h) => h.supports(input.reward.type));

    if (!handler) {
      throw new Error(`No handler for reward type: ${input.reward.type}`);
    }

    return handler.redeem(input); // 🔥 return
  }
}
