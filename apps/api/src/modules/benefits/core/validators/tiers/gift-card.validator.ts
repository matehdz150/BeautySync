import { BadRequestException } from '@nestjs/common';
import { TierRewardConfigValidator } from './tier-reward-config.validator.interface';
import { TierRewardConfig } from '../../entities/tier-reward.entity';

type GiftCardConfigInput = {
  type: 'gift_card';
  amountCents: number;
  expiresInDays?: number;
};

export class GiftCardRewardValidator implements TierRewardConfigValidator {
  supports(type: string) {
    return type === 'gift_card';
  }

  validate(config: unknown): TierRewardConfig {
    if (!this.isValid(config)) {
      throw new BadRequestException('Invalid gift card config');
    }

    return {
      type: 'gift_card', // 🔥 ahora sí literal
      amountCents: config.amountCents,
      expiresInDays: config.expiresInDays,
    };
  }

  private isValid(config: unknown): config is GiftCardConfigInput {
    if (typeof config !== 'object' || config === null) {
      return false;
    }

    const obj = config as Record<string, unknown>;

    return (
      obj.type === 'gift_card' &&
      typeof obj.amountCents === 'number' &&
      obj.amountCents > 0 &&
      (obj.expiresInDays === undefined || typeof obj.expiresInDays === 'number')
    );
  }
}
