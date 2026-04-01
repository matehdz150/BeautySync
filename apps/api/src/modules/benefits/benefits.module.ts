import { Module } from '@nestjs/common';
import { DomainEventsModule } from 'src/shared/domain-events/domain-events.module';

// =====================
// REPOSITORIES
// =====================
import { DrizzleBenefitPointsRepository } from './infrastructure/adapters/drizzle-benefit-points.repository';
import { DrizzleBenefitProgressRepository } from './infrastructure/adapters/drizzle-benefit-progress.repository';
import { DrizzleBenefitBalanceRepository } from './infrastructure/adapters/drizzle-benefit-balance.repository';
import { DrizzleBenefitRewardRepository } from './infrastructure/adapters/drizzle-benefit-reward.repository';
import { DrizzleBenefitRedemptionRepository } from './infrastructure/adapters/drizzle-benefit-redemption.repository';
import { DrizzleTransactionManager } from './infrastructure/adapters/drizzle-transaction-manager.repository';

// =====================
// USE CASES
// =====================
import { ProcessBookingBenefitsUseCase } from './core/use-cases/process-booking-benefits.use-case';
import { ProcessReviewBenefitsUseCase } from './core/use-cases/process-review-benefits.use-case';
import { ProcessPaymentBenefitsUseCase } from './core/use-cases/process-payment-benefits.use-case';
import { RedeemBenefitRewardUseCase } from './core/use-cases/reedem-benefit.use-case';

// =====================
// ENGINE
// =====================
import { BenefitRuleEngine } from './core/engine/benefit-rule-engine.service';
import { BenefitRewardEngine } from './core/engine/benefit-reward-engine.service';

// =====================
// RULE HANDLERS
// =====================
import { BookingCountRuleHandler } from './core/handlers/booking-count-rule.handler';
import { SpendAccumulatedRuleHandler } from './core/handlers/spend-acumumulate-rule.handler';
import { ReviewCreatedRuleHandler } from './core/handlers/review-created-rule.handler';
import { OnlinePaymentRuleHandler } from './core/handlers/online-payment.rule.handler';

// =====================
// EVENT HANDLERS
// =====================
import { BookingCreatedHandler } from './application/handlers/booking-created.handler';
import { ReviewCreatedHandler } from './application/handlers/review-created.handler';
import { PaymentCompletedHandler } from './application/handlers/payment-completed.handler';

import {
  BENEFIT_PROGRAM_REPOSITORY,
  BENEFIT_REWARD_HANDLERS,
  BENEFIT_RULE_REPOSITORY,
} from './core/ports/tokens';

// handlers
import { ServiceRewardHandler } from './core/handlers/rewards/service-reward.handler';
import { CouponRewardHandler } from './core/handlers/rewards/coupon-reward.handler';
import { GiftCardRewardHandler } from './core/handlers/rewards/gift-card-reward.handler';

// =====================
// TOKENS
// =====================
import {
  BENEFIT_POINTS_REPOSITORY,
  BENEFIT_PROGRESS_REPOSITORY,
  BENEFIT_BALANCE_REPOSITORY,
  BENEFIT_REWARD_REPOSITORY,
  BENEFIT_REDEMPTION_REPOSITORY,
  BENEFIT_TRANSACTION_MANAGER,
  BENEFIT_RULE_HANDLERS,
} from './core/ports/tokens';
import { CouponsModule } from '../cupons/cupons.module';
import { GiftCardsModule } from '../gift-cards/gift-cards.module';
import { DrizzleBenefitProgramRepository } from './infrastructure/adapters/drizzle-benefit-program.repository';
import { DrizzleBenefitRuleRepository } from './infrastructure/adapters/drizzle-benefit-rule.repository';
import { BenefitProgramController } from './application/controllers/benefit-program.controller';
import { AuthModule } from '../auth/auth.module';
import { ActivateBenefitProgramUseCase } from './core/use-cases/activate-benefit-programm.use-case';
import { BranchesModule } from '../branches/branches.module';
import { GetBenefitRulesByBranchUseCase } from './core/use-cases/get-benefit-rules-by-branch.use-case';

@Module({
  imports: [
    DomainEventsModule,
    CouponsModule,
    GiftCardsModule,
    AuthModule,
    BranchesModule,
  ],
  controllers: [BenefitProgramController],

  providers: [
    // =====================
    // REPOSITORIES
    // =====================
    {
      provide: BENEFIT_POINTS_REPOSITORY,
      useClass: DrizzleBenefitPointsRepository,
    },
    {
      provide: BENEFIT_PROGRESS_REPOSITORY,
      useClass: DrizzleBenefitProgressRepository,
    },
    {
      provide: BENEFIT_BALANCE_REPOSITORY,
      useClass: DrizzleBenefitBalanceRepository,
    },
    {
      provide: BENEFIT_REWARD_REPOSITORY,
      useClass: DrizzleBenefitRewardRepository,
    },
    {
      provide: BENEFIT_REDEMPTION_REPOSITORY,
      useClass: DrizzleBenefitRedemptionRepository,
    },
    {
      provide: BENEFIT_TRANSACTION_MANAGER,
      useClass: DrizzleTransactionManager,
    },
    {
      provide: BENEFIT_PROGRAM_REPOSITORY,
      useClass: DrizzleBenefitProgramRepository,
    },
    {
      provide: BENEFIT_RULE_REPOSITORY,
      useClass: DrizzleBenefitRuleRepository,
    },

    // =====================
    // RULE HANDLERS ARRAY 🔥
    // =====================
    BookingCountRuleHandler,
    SpendAccumulatedRuleHandler,
    ReviewCreatedRuleHandler,
    OnlinePaymentRuleHandler,

    // =====================
    // REWARD HANDLERS
    // =====================
    ServiceRewardHandler,
    CouponRewardHandler,
    GiftCardRewardHandler,

    {
      provide: BENEFIT_RULE_HANDLERS,
      useFactory: (
        booking: BookingCountRuleHandler,
        spend: SpendAccumulatedRuleHandler,
        review: ReviewCreatedRuleHandler,
        online: OnlinePaymentRuleHandler,
      ) => [booking, spend, review, online],
      inject: [
        BookingCountRuleHandler,
        SpendAccumulatedRuleHandler,
        ReviewCreatedRuleHandler,
        OnlinePaymentRuleHandler,
      ],
    },
    {
      provide: BENEFIT_REWARD_HANDLERS,
      useFactory: (
        service: ServiceRewardHandler,
        coupon: CouponRewardHandler,
        gift: GiftCardRewardHandler,
      ) => [service, coupon, gift],
      inject: [
        ServiceRewardHandler,
        CouponRewardHandler,
        GiftCardRewardHandler,
      ],
    },

    // =====================
    // ENGINE
    // =====================
    BenefitRuleEngine,
    BenefitRewardEngine,

    // =====================
    // USE CASES
    // =====================
    ProcessBookingBenefitsUseCase,
    ProcessReviewBenefitsUseCase,
    ProcessPaymentBenefitsUseCase,
    RedeemBenefitRewardUseCase,
    ActivateBenefitProgramUseCase,
    GetBenefitRulesByBranchUseCase,

    // =====================
    // EVENT HANDLERS
    // =====================
    BookingCreatedHandler,
    ReviewCreatedHandler,
    PaymentCompletedHandler,
  ],

  exports: [
    RedeemBenefitRewardUseCase, // por si lo usas fuera
  ],
})
export class BenefitsModule {}
