import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { BenefitRewardHandler } from '../../engine/benefit-reward-handler.interface';
import { CouponRepository } from 'src/modules/cupons/core/ports/coupon.repository';
import { COUPON_REPOSITORY } from 'src/modules/cupons/core/ports/tokens';
import { BenefitRewardType, RedeemRewardInput } from '../../engine/types';
import { randomUUID } from 'crypto';

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

    // 🔥 VALIDACIÓN
    if (!config || !config.type || typeof config.value !== 'number') {
      throw new BadRequestException('Invalid coupon config');
    }

    const code = this.generateCode();

    const coupon = await this.couponsRepo.create({
      branchId: input.branchId,
      code,
      type: config.type,
      value: config.value,
      assignedToUserId: input.userId,
      expiresAt: config.expiresAt ? new Date(config.expiresAt) : undefined,
    });

    return {
      type: 'COUPON' as const,
      code,
      couponId: coupon.id,
      value: config.value,
      expiresAt: config.expiresAt ?? null,
    };
  }

  private generateCode() {
    return `BEN-${randomUUID().slice(0, 8).toUpperCase()}`;
  }
}
