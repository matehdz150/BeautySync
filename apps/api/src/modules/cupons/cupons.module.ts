// coupons.module.ts

import { Module } from '@nestjs/common';

import { COUPON_REPOSITORY } from './core/ports/tokens';
import { DrizzleCouponRepository } from './infrastructure/adapters/drizzle-coupon.repository';

import { CreateCouponUseCase } from './core/use-cases/create-coupon.use-case';
import { ValidateCouponUseCase } from './core/use-cases/validate-cupon.use-case';
import { ApplyCouponUseCase } from './core/use-cases/apply-coupon.use-case';

import { CouponsController } from './application/cupons.controller';
import { BranchesModule } from '../branches/branches.module';
import { AuthModule } from '../auth/auth.module';
import { GetCouponsByBranchUseCase } from './core/use-cases/get-coupons-by-branch.use-case';
import { InternalCouponService } from './core/services/internal-coupon.service';

@Module({
  imports: [BranchesModule, AuthModule],
  controllers: [CouponsController],
  providers: [
    {
      provide: COUPON_REPOSITORY,
      useClass: DrizzleCouponRepository,
    },

    CreateCouponUseCase,
    ValidateCouponUseCase,
    ApplyCouponUseCase,
    GetCouponsByBranchUseCase,
    InternalCouponService,
  ],
  exports: [
    ValidateCouponUseCase,
    ApplyCouponUseCase,
    InternalCouponService,
    COUPON_REPOSITORY,
  ],
})
export class CouponsModule {}
