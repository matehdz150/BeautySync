// core/use-cases/apply-coupon.use-case.ts

import { Inject, Injectable } from '@nestjs/common';
import { COUPON_REPOSITORY } from '../ports/tokens';
import { CouponRepository } from '../ports/coupon.repository';

@Injectable()
export class ApplyCouponUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly repo: CouponRepository,
  ) {}

  async execute(couponId: string, tx?: any) {
    await this.repo.incrementUsage(couponId, tx);
  }
}
