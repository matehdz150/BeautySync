import { Inject, Injectable } from '@nestjs/common';
import { BenefitRewardHandler } from '../../engine/benefit-reward-handler.interface';
import { GIFT_CARD_REPOSITORY } from 'src/modules/gift-cards/core/ports/tokens';
import { GiftCardRepository } from 'src/modules/gift-cards/core/ports/gift-card.repository';
import { BenefitRewardType, RedeemRewardInput } from '../../engine/ types';

@Injectable()
export class GiftCardRewardHandler implements BenefitRewardHandler {
  constructor(
    @Inject(GIFT_CARD_REPOSITORY)
    private readonly giftCardsRepo: GiftCardRepository,
  ) {}

  supports(type: BenefitRewardType) {
    return type === 'GIFT_CARD';
  }

  async redeem(input: RedeemRewardInput) {
    const config = input.reward.config as {
      amountCents: number;
    };

    await this.giftCardsRepo.create({
      branchId: input.branchId,
      code: this.generateCode(),
      initialAmountCents: config.amountCents,
      ownerUserId: input.userId,
    });
  }

  private generateCode() {
    return `GC-${Date.now()}`;
  }
}
