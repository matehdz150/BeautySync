import { Injectable, BadRequestException } from '@nestjs/common';
import { BenefitRewardHandler } from '../../engine/benefit-reward-handler.interface';
import { BenefitRewardType, RedeemRewardInput } from '../../engine/types';
import { InternalCouponService } from 'src/modules/cupons/core/services/internal-coupon.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ServiceRewardHandler implements BenefitRewardHandler {
  constructor(private readonly internalCouponService: InternalCouponService) {}

  supports(type: BenefitRewardType) {
    return type === 'SERVICE';
  }

  async redeem(input: RedeemRewardInput) {
    if (!input.reward.referenceId) {
      throw new BadRequestException('Service reward requires referenceId');
    }

    const code = this.generateCode();

    await this.internalCouponService.createCoupon({
      branchId: input.branchId,
      code,
      type: 'percentage',
      value: 100,
      assignedToUserId: input.userId,
      serviceIds: [input.reward.referenceId],
    });

    return {
      type: 'SERVICE' as const,
      code,
      serviceId: input.reward.referenceId,
    };
  }

  private generateCode() {
    return `SRV-${randomUUID().slice(0, 8).toUpperCase()}`;
  }
}
