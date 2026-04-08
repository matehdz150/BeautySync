import { Inject, Injectable } from '@nestjs/common';

import { BENEFIT_POINTS_REPOSITORY } from '../../ports/tokens';
import { BENEFIT_TIERS_REPOSITORY } from '../../ports/tokens';
import { TIER_REWARDS_REPOSITORY } from '../../ports/tokens';
import { TIER_REWARD_GRANT_REPOSITORY } from '../../ports/tokens';
import { BENEFIT_PROGRAM_REPOSITORY } from '../../ports/tokens';

import { GIFT_CARD_REPOSITORY } from 'src/modules/gift-cards/core/ports/tokens';
import { COUPON_REPOSITORY } from 'src/modules/cupons/core/ports/tokens';

import * as pointsRepo from '../../ports/benefit-points.repository';
import * as tiersRepo from '../../ports/benefit-tier.repository';
import * as rewardsRepo from '../../ports/tier-reward.repository';
import * as grantRepo from '../../ports/tier-reward-grant.repository';
import * as programRepo from '../../ports/benefit-program.repository';

import { GiftCardRepository } from 'src/modules/gift-cards/core/ports/gift-card.repository';
import { CouponRepository } from 'src/modules/cupons/core/ports/coupon.repository';

@Injectable()
export class ProcessUserTierProgressUseCase {
  constructor(
    @Inject(BENEFIT_POINTS_REPOSITORY)
    private readonly pointsRepo: pointsRepo.BenefitPointsRepository,

    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepo: programRepo.BenefitProgramRepository,

    @Inject(BENEFIT_TIERS_REPOSITORY)
    private readonly tiersRepo: tiersRepo.BenefitTiersRepository,

    @Inject(TIER_REWARDS_REPOSITORY)
    private readonly rewardsRepo: rewardsRepo.TierRewardsRepository,

    @Inject(TIER_REWARD_GRANT_REPOSITORY)
    private readonly grantRepo: grantRepo.TierRewardGrantRepository,

    @Inject(GIFT_CARD_REPOSITORY)
    private readonly giftCardRepo: GiftCardRepository,

    @Inject(COUPON_REPOSITORY)
    private readonly couponRepo: CouponRepository,
  ) {}

  async execute(input: { userId: string; branchId: string }) {
    const { userId, branchId } = input;

    // =========================
    // 1. programa activo
    // =========================
    const program = await this.programRepo.findByBranchId(branchId);

    if (!program || !program.isActive) return;

    // =========================
    // 2. puntos para tier (acumulados positivos)
    // =========================
    // NOTE: tier should not go down when user redeems points.
    const userPoints = await this.pointsRepo.getTierPoints({
      userId,
      branchId,
    });

    // =========================
    // 3. tiers
    // =========================
    const tiers = await this.tiersRepo.getByProgram(program.id);

    if (!tiers.length) return;

    const sortedTiers = [...tiers].sort((a, b) => a.minPoints - b.minPoints);

    // =========================
    // 4. tier actual
    // =========================
    const currentTier = sortedTiers
      .filter((t) => userPoints >= t.minPoints)
      .pop();

    if (!currentTier) return;

    // =========================
    // 5. rewards del tier
    // =========================
    const rewards = await this.rewardsRepo.getByTier(currentTier.id);

    // =========================
    // 6. ejecutar rewards
    // =========================
    for (const reward of rewards) {
      const config = reward.config;

      // =========================
      // 🔒 ONE_TIME protection
      // =========================
      if (reward.type === 'ONE_TIME') {
        const alreadyGranted = await this.grantRepo.exists({
          userId,
          branchId,
          tierRewardId: reward.id,
        });

        if (alreadyGranted) continue;
      }

      // =========================
      // 🎁 GIFT CARD
      // =========================
      if (config.type === 'gift_card') {
        await this.giftCardRepo.create({
          branchId,
          code: this.generateCode(),
          initialAmountCents: config.amountCents,
          ownerUserId: userId,
          expiresAt: config.expiresInDays
            ? this.futureDate(config.expiresInDays)
            : undefined,
        });
      }

      // =========================
      // 🎟 COUPON %
      // =========================
      if (config.type === 'coupon_percentage') {
        await this.couponRepo.create({
          branchId,
          code: this.generateCode(),
          type: 'percentage',
          value: config.value,
          assignedToUserId: userId,
          expiresAt: config.expiresInDays
            ? this.futureDate(config.expiresInDays)
            : undefined,
        });
      }

      // =========================
      // 💰 COUPON FIXED
      // =========================
      if (config.type === 'coupon_fixed') {
        await this.couponRepo.create({
          branchId,
          code: this.generateCode(),
          type: 'fixed',
          value: config.value,
          assignedToUserId: userId,
          expiresAt: config.expiresInDays
            ? this.futureDate(config.expiresInDays)
            : undefined,
        });
      }

      // =========================
      // 📝 marcar como otorgado
      // =========================
      await this.grantRepo.create({
        userId,
        branchId,
        tierRewardId: reward.id,
      });
    }
  }

  // =========================
  // helpers
  // =========================
  private generateCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private futureDate(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  }
}
