import { Injectable } from '@nestjs/common';
import { BenefitRewardHandler } from '../../engine/benefit-reward-handler.interface';
import { BenefitRewardType, RedeemRewardInput } from '../../engine/ types';
import { InternalCouponService } from 'src/modules/cupons/core/services/internal-coupon.service';

@Injectable()
export class ServiceRewardHandler implements BenefitRewardHandler {
  constructor(private readonly internalCouponService: InternalCouponService) {}

  supports(type: BenefitRewardType) {
    return type === 'SERVICE';
  }

  async redeem(input: RedeemRewardInput) {
    if (!input.reward.referenceId) {
      throw new Error('Service reward requires referenceId');
    }

    const code = this.generateCode();

    await this.internalCouponService.createCoupon({
      branchId: input.branchId,
      code,

      type: 'percentage',
      value: 100, // 🔥 100% descuento

      assignedToUserId: input.userId,

      serviceIds: [input.reward.referenceId],
    });
  }

  private generateCode() {
    return `SRV-${Math.random().toString(36).substring(2, 10)}`;
  }
}
