import { Inject, Injectable } from '@nestjs/common';
import { BenefitRewardHandler } from '../../engine/benefit-reward-handler.interface';
import { CouponRepository } from 'src/modules/cupons/core/ports/coupon.repository';
import { COUPON_REPOSITORY } from 'src/modules/cupons/core/ports/tokens';
import { BenefitRewardType, RedeemRewardInput } from '../../engine/ types';

@Injectable()
export class CouponRewardHandler implements BenefitRewardHandler {
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly couponsRepo: CouponRepository,
  ) {}

  supports(type: BenefitRewardType) {
    return type === 'COUPON';
  }

  async redeem(input: RedeemRewardInput) {
    const config = input.reward.config as {
      type: 'percentage' | 'fixed';
      value: number;
      expiresAt?: string;
    };

    await this.couponsRepo.create({
      branchId: input.branchId,
      code: this.generateCode(),
      type: config.type,
      value: config.value,
      assignedToUserId: input.userId,
      expiresAt: config.expiresAt ? new Date(config.expiresAt) : undefined,
    });
  }

  private generateCode() {
    return `BEN-${Math.random().toString(36).substring(2, 10)}`;
  }
}
