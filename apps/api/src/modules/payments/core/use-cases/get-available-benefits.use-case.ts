// modules/payments/core/use-cases/get-available-benefits.use-case.ts

import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { PaymentBenefitsCacheService } from '../../application/payment-benefits-cache.service';

@Injectable()
export class GetAvailablePaymentBenefitsUseCase {
  constructor(private readonly benefitsCache: PaymentBenefitsCacheService) {}

  async execute(input: { branchId: string; publicUserId?: string }) {
    const { branchId, publicUserId } = input;

    // =========================
    // 👻 GUEST MODE
    // =========================
    if (!publicUserId) {
      return {
        hasActiveProgram: false,
        giftCards: [],
        coupons: [],
        pointsBalance: 0,
        redeemableRewards: { availableCount: 0, rewards: [] },
        tier: null,
        tierRewards: [],
        isAuthenticated: false,
      };
    }

    // =========================
    // 🔒 VALIDATIONS
    // =========================
    if (!branchId) {
      throw new BadRequestException('branchId is required');
    }

    const benefits = await this.benefitsCache.get({
      branchId,
      publicUserId,
    });

    return {
      ...benefits,
      isAuthenticated: true,
    };
  }
}
