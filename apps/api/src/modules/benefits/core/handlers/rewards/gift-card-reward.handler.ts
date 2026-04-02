import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { BenefitRewardHandler } from '../../engine/benefit-reward-handler.interface';
import { GIFT_CARD_REPOSITORY } from 'src/modules/gift-cards/core/ports/tokens';
import { GiftCardRepository } from 'src/modules/gift-cards/core/ports/gift-card.repository';
import { BenefitRewardType, RedeemRewardInput } from '../../engine/types';
import { randomUUID } from 'crypto';

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

    // 🔥 VALIDACIÓN
    if (!config || typeof config.amountCents !== 'number') {
      throw new BadRequestException('Invalid gift card config');
    }

    const code = this.generateCode();

    const giftCard = await this.giftCardsRepo.create({
      branchId: input.branchId,
      code,
      initialAmountCents: config.amountCents,
      ownerUserId: input.userId,
    });

    // 🔥 RETURN (CRÍTICO)
    return {
      type: 'GIFT_CARD' as const,
      code,
      amountCents: config.amountCents,
      giftCardId: giftCard.id,
    };
  }

  private generateCode() {
    return `GC-${randomUUID().slice(0, 8).toUpperCase()}`;
  }
}
