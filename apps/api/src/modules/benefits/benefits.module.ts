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
  BENEFIT_RULE_CONFIG_VALIDATORS,
  BENEFIT_RULE_REPOSITORY,
  BENEFIT_TIERS_REPOSITORY,
  TIER_REWARD_CONFIG_VALIDATORS,
  TIER_REWARDS_REPOSITORY,
  USER_TIER_STATE_REPOSITORY,
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
import { CreateBenefitEarnRuleUseCase } from './core/use-cases/create-benefit-earn-rule.use-case';
import { SpendAccumulatedConfigValidator } from './core/validators/spend-accumulated.validator';
import { BookingCountConfigValidator } from './core/validators/booking-count.validator';
import { FirstBookingConfigValidator } from './core/validators/first-booking.validator';
import { ReviewCreatedConfigValidator } from './core/validators/review-created.validator';
import { OnlinePaymentConfigValidator } from './core/validators/online-payment.validator';
import { ReferralConfigValidator } from './core/validators/referral.validator';
import { CreateBenefitRewardUseCase } from './core/use-cases/create-benefit-reward.use-case';
import { BenefitsEventRegistry } from './application/handlers/benefits-event.registry';
import { CacheModule } from '../cache/cache.module';
import { GetUserWalletSummaryUseCase } from './core/use-cases/get-user-points.use-case';
import { PaymentsModule } from '../payments/payments.module';
import { BenefitTiersController } from './application/controllers/tiers/benefit-tiers.controller';
import { CreateTierWithRewardsUseCase } from './core/use-cases/tiers/create-benefit-tier.use-case';
import { DrizzleBenefitTiersRepository } from './infrastructure/adapters/drizzle-benefit-tiers.repository';
import { DrizzleTierRewardsRepository } from './infrastructure/adapters/drizzle-tier-rewards.repository';
import { GiftCardRewardValidator } from './core/validators/tiers/gift-card.validator';
import { CouponPercentageValidator } from './core/validators/tiers/CouponPercentage.validator';
import { CouponFixedValidator } from './core/validators/tiers/CouponFixed.validator';
import { db } from '../db/client';
import { DrizzleUserTierStateRepository } from './infrastructure/adapters/drizzle-user-tier-state.repository';
import { GetBranchTiersUseCase } from './core/use-cases/tiers/get-branch-tiers.use-case';
import { UpdateTierWithRewardsUseCase } from './core/use-cases/tiers/update-tier-with-reward.use-case';
import { DeleteTierUseCase } from './core/use-cases/tiers/delete-tier.use-case';
import { Queue } from 'bullmq';
import { redis } from '../queues/redis/redis.provider';
import { GetTierByIdUseCase } from './core/use-cases/tiers/get-tier-by-id.use-case';
import { UpdateBenefitEarnRuleUseCase } from './core/use-cases/update-benefit-earn-rule.use-case';
import { DeleteBenefitEarnRuleUseCase } from './core/use-cases/delete-benefit-earn-rule.use-case';

@Module({
  imports: [
    DomainEventsModule,
    CouponsModule,
    GiftCardsModule,
    AuthModule,
    BranchesModule,
    CacheModule,
    PaymentsModule,
  ],
  controllers: [BenefitProgramController, BenefitTiersController],

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
    {
      provide: BENEFIT_TIERS_REPOSITORY,
      useClass: DrizzleBenefitTiersRepository,
    },
    {
      provide: TIER_REWARDS_REPOSITORY,
      useClass: DrizzleTierRewardsRepository,
    },
    {
      provide: USER_TIER_STATE_REPOSITORY,
      useClass: DrizzleUserTierStateRepository,
    },
    {
      provide: TIER_REWARD_CONFIG_VALIDATORS,
      useFactory: (
        gift: GiftCardRewardValidator,
        percentage: CouponPercentageValidator,
        fixed: CouponFixedValidator,
      ) => [gift, percentage, fixed],
      inject: [
        GiftCardRewardValidator,
        CouponPercentageValidator,
        CouponFixedValidator,
      ],
    },
    {
      provide: 'DB',
      useValue: db,
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
    {
      provide: BENEFIT_RULE_CONFIG_VALIDATORS,
      useFactory: (
        booking: BookingCountConfigValidator,
        spend: SpendAccumulatedConfigValidator,
        review: ReviewCreatedConfigValidator,
        online: OnlinePaymentConfigValidator,
        first: FirstBookingConfigValidator,
        referral: ReferralConfigValidator,
      ) => [booking, spend, review, online, first, referral],
      inject: [
        BookingCountConfigValidator,
        SpendAccumulatedConfigValidator,
        ReviewCreatedConfigValidator,
        OnlinePaymentConfigValidator,
        FirstBookingConfigValidator,
        ReferralConfigValidator,
      ],
    },
    {
      provide: 'TIERS_QUEUE',
      useFactory: () => {
        return new Queue('tiers-queue', {
          connection: redis,
        });
      },
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
    CreateBenefitEarnRuleUseCase,
    UpdateBenefitEarnRuleUseCase,
    DeleteBenefitEarnRuleUseCase,
    BookingCountConfigValidator,
    SpendAccumulatedConfigValidator,
    FirstBookingConfigValidator,
    ReviewCreatedConfigValidator,
    OnlinePaymentConfigValidator,
    ReferralConfigValidator,
    CreateBenefitRewardUseCase,
    GetUserWalletSummaryUseCase,
    CreateTierWithRewardsUseCase,
    GiftCardRewardValidator,
    CouponPercentageValidator,
    CouponFixedValidator,
    GetBranchTiersUseCase,
    UpdateTierWithRewardsUseCase,
    DeleteTierUseCase,
    GetTierByIdUseCase,

    // =====================
    // EVENT HANDLERS
    // =====================
    BookingCreatedHandler,
    ReviewCreatedHandler,
    PaymentCompletedHandler,
    BenefitsEventRegistry,
  ],

  exports: [
    RedeemBenefitRewardUseCase, // por si lo usas fuera
  ],
})
export class BenefitsModule {}
