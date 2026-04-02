// modules/benefits/core/services/process-user-tier-progress.ts

import { BenefitBalanceRepository } from '../ports/benefit-balance.repository';
import { BenefitProgramRepository } from '../ports/benefit-program.repository';
import { BenefitTiersRepository } from '../ports/benefit-tier.repository';
import { TierRewardsRepository } from '../ports/tier-reward.repository';
import { TierRewardGrantRepository } from '../ports/tier-reward-grant.repository';

import { GiftCardRepository } from 'src/modules/gift-cards/core/ports/gift-card.repository';
import { CouponRepository } from 'src/modules/cupons/core/ports/coupon.repository';

import { TierRewardConfig } from '../entities/tier-reward.entity';
import { db } from 'src/modules/db/client';
import { userTierState } from 'src/modules/db/schema';

type ProcessUserTierProgressParams = {
  userId: string;
  branchId: string;

  balanceRepo: BenefitBalanceRepository;
  programRepo: BenefitProgramRepository;
  tiersRepo: BenefitTiersRepository;
  rewardsRepo: TierRewardsRepository;
  grantRepo: TierRewardGrantRepository;
  giftCardRepo: GiftCardRepository;
  couponRepo: CouponRepository;
};

function generateCode(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function futureDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export async function processUserTierProgress(
  params: ProcessUserTierProgressParams,
): Promise<{
  tierId: string | null;
  tierChanged: boolean;
  isUpgrade: boolean;
}> {
  const {
    userId,
    branchId,
    balanceRepo,
    programRepo,
    tiersRepo,
    rewardsRepo,
    grantRepo,
    giftCardRepo,
    couponRepo,
  } = params;

  // =========================
  // 1. programa activo
  // =========================
  const program = await programRepo.findByBranchId(branchId);
  if (!program || !program.isActive) {
    return { tierId: null, tierChanged: false, isUpgrade: false };
  }

  // =========================
  // 2. puntos usuario
  // =========================
  const balance = await balanceRepo.getByUserAndBranch({
    userId,
    branchId,
  });

  const userPoints = balance?.pointsBalance ?? 0;

  // =========================
  // 3. tiers
  // =========================
  const tiers = await tiersRepo.getByProgram(program.id);
  if (!tiers.length) {
    return { tierId: null, tierChanged: false, isUpgrade: false };
  }

  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);

  const currentTier = sorted.filter((t) => userPoints >= t.minPoints).pop();

  if (!currentTier) {
    return { tierId: null, tierChanged: false, isUpgrade: false };
  }

  // =========================
  // 4. estado anterior
  // =========================
  const prevState = await db.query.userTierState.findFirst({
    where: (t, { and, eq }) =>
      and(eq(t.userId, userId), eq(t.branchId, branchId)),
  });

  const prevTierId = prevState?.currentTierId ?? null;

  const tierChanged = prevTierId !== currentTier.id;

  const prevTier = sorted.find((t) => t.id === prevTierId);

  const isUpgrade = !prevTier || currentTier.minPoints > prevTier.minPoints;

  const isDowngrade = prevTier && currentTier.minPoints < prevTier.minPoints;

  // =========================
  // 5. guardar estado
  // =========================
  await db
    .insert(userTierState)
    .values({
      userId,
      branchId,
      currentTierId: currentTier.id,
    })
    .onConflictDoUpdate({
      target: [userTierState.userId, userTierState.branchId],
      set: {
        currentTierId: currentTier.id,
        updatedAt: new Date(),
      },
    });

  // =========================
  // 6. si NO cambió → salir
  // =========================
  if (!tierChanged) {
    return {
      tierId: currentTier.id,
      tierChanged: false,
      isUpgrade: false,
    };
  }

  // =========================
  // 7. rewards SOLO en upgrade
  // =========================
  if (isUpgrade) {
    const rewards = await rewardsRepo.getByTier(currentTier.id);

    for (const reward of rewards) {
      const config: TierRewardConfig = reward.config;

      // ONE_TIME
      if (reward.type === 'ONE_TIME') {
        const exists = await grantRepo.exists({
          userId,
          branchId,
          tierRewardId: reward.id,
        });

        if (exists) continue;
      }

      // =====================
      // ejecutar reward
      // =====================
      if (config.type === 'gift_card') {
        await giftCardRepo.create({
          branchId,
          code: generateCode('GC'),
          initialAmountCents: config.amountCents,
          ownerUserId: userId,
          expiresAt: config.expiresInDays
            ? futureDate(config.expiresInDays)
            : undefined,
        });
      }

      if (config.type === 'coupon_percentage') {
        await couponRepo.create({
          branchId,
          code: generateCode('CP'),
          type: 'percentage',
          value: config.value,
          assignedToUserId: userId,
          expiresAt: config.expiresInDays
            ? futureDate(config.expiresInDays)
            : undefined,
        });
      }

      if (config.type === 'coupon_fixed') {
        await couponRepo.create({
          branchId,
          code: generateCode('CF'),
          type: 'fixed',
          value: config.value,
          assignedToUserId: userId,
          expiresAt: config.expiresInDays
            ? futureDate(config.expiresInDays)
            : undefined,
        });
      }

      await grantRepo.create({
        userId,
        branchId,
        tierRewardId: reward.id,
      });
    }
  }

  // =========================
  // 8. downgrade (opcional)
  // =========================
  if (isDowngrade) {
    console.log('⬇️ user downgraded tier', {
      userId,
      from: prevTierId,
      to: currentTier.id,
    });

    // aquí podrías:
    // - remover beneficios
    // - marcar estado
  }

  return {
    tierId: currentTier.id,
    tierChanged: true,
    isUpgrade,
  };
}
