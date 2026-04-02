import { BadRequestException } from '@nestjs/common';
import { TierRewardConfigValidator } from './tier-reward-config.validator.interface';
import { TierRewardConfig } from '../../entities/tier-reward.entity';

type CouponFixedInput = {
  type: 'coupon_fixed';
  value: number;
  expiresInDays?: number;
};

export class CouponFixedValidator implements TierRewardConfigValidator {
  supports(type: string) {
    return type === 'coupon_fixed';
  }

  validate(config: unknown): TierRewardConfig {
    if (!this.isValid(config)) {
      throw new BadRequestException('Invalid fixed coupon config');
    }

    return {
      type: 'coupon_fixed',
      value: config.value,
      expiresInDays: config.expiresInDays,
    };
  }

  private isValid(config: unknown): config is CouponFixedInput {
    if (typeof config !== 'object' || config === null) return false;

    const obj = config as Record<string, unknown>;

    if (obj.type !== 'coupon_fixed') return false;

    if (typeof obj.value !== 'number' || obj.value <= 0) return false;

    if (
      obj.expiresInDays !== undefined &&
      typeof obj.expiresInDays !== 'number'
    ) {
      return false;
    }

    return true;
  }
}
