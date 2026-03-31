import { Inject, Injectable } from '@nestjs/common';
import { CouponRepository } from '../ports/coupon.repository';
import { COUPON_REPOSITORY } from '../ports/tokens';

@Injectable()
export class InternalCouponService {
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly repo: CouponRepository,
  ) {}

  async createCoupon(input: {
    branchId: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    assignedToUserId?: string | null;
    expiresAt?: Date | null;
    serviceIds?: string[];
  }) {
    const coupon = await this.repo.create({
      ...input,
    });

    if (input.serviceIds?.length) {
      await this.repo.assignServices(coupon.id, input.serviceIds);
    }

    return coupon;
  }
}
