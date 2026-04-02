import { Inject, Injectable } from '@nestjs/common';
import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import { BENEFIT_BALANCE_REPOSITORY } from '../ports/tokens';
import {
  BRANCH_IMAGES_REPOSITORY,
  BRANCHES_REPOSITORY,
} from 'src/modules/branches/core/ports/tokens';

import * as repo from '../ports/benefit-balance.repository';
import * as cachePort from 'src/modules/cache/core/ports/cache.port';
import * as branchesRepo from 'src/modules/branches/core/ports/branches.repository';
import { BranchImagesRepository } from 'src/modules/branches/core/ports/branch-images.repository';
import { PAYMENTS_REPOSITORY } from 'src/modules/payments/core/ports/tokens';
import { PaymentsRepositoryPort } from 'src/modules/payments/core/ports/payment.repository';

import { USER_TIER_STATE_REPOSITORY } from '../ports/tokens';
import { UserTierStateRepository } from '../ports/user-tier-state.repository';

import { BENEFIT_TIERS_REPOSITORY } from '../ports/tokens';
import { BenefitTiersRepository } from '../ports/benefit-tier.repository';

// ===============================

export interface UserWalletSummaryResponse {
  global: {
    totalGiftCardCents: number;
  };
  branches: repo.UserBenefitsWalletItem[];
}

// ===============================

@Injectable()
export class GetUserWalletSummaryUseCase {
  constructor(
    @Inject(BENEFIT_BALANCE_REPOSITORY)
    private readonly balanceRepo: repo.BenefitBalanceRepository,

    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepo: PaymentsRepositoryPort,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: branchesRepo.BranchesRepository,

    @Inject(BRANCH_IMAGES_REPOSITORY)
    private readonly imagesRepo: BranchImagesRepository,

    @Inject(USER_TIER_STATE_REPOSITORY)
    private readonly userTierRepo: UserTierStateRepository,

    @Inject(BENEFIT_TIERS_REPOSITORY)
    private readonly tiersRepo: BenefitTiersRepository,

    @Inject(CACHE_PORT)
    private readonly cache: cachePort.CachePort,
  ) {}

  async execute(userId: string): Promise<UserWalletSummaryResponse> {
    const cacheKey = `benefits:wallet:${userId}`;

    const cached = await this.cache.get<UserWalletSummaryResponse>(cacheKey);
    if (cached) return cached;

    // =========================
    // 1. balances
    // =========================
    const balances = await this.balanceRepo.getAllUserBalances(userId);

    const benefitBranches =
      await this.paymentsRepo.getUserBenefitBranchIds(userId);

    const allBranchIds = Array.from(
      new Set([...balances.map((b) => b.branchId), ...benefitBranches]),
    );

    if (!allBranchIds.length) {
      return {
        global: { totalGiftCardCents: 0 },
        branches: [],
      };
    }

    const branchIds = allBranchIds;

    // =========================
    // 2. parallel
    // =========================
    const [branches, images, benefits, tierStates] = await Promise.all([
      Promise.all(branchIds.map((id) => this.branchesRepo.findById(id))),
      Promise.all(branchIds.map((id) => this.imagesRepo.getByBranch(id))),
      Promise.all(
        branchIds.map((branchId) =>
          this.paymentsRepo.getAvailableBenefits({
            branchId,
            publicUserId: userId,
          }),
        ),
      ),
      this.userTierRepo.getByUser(userId), // 🔥 todos los tiers del usuario
    ]);

    const branchMap = new Map(branches.map((b) => [b?.id, b]));
    const imagesMap = new Map(branchIds.map((id, i) => [id, images[i]]));
    const benefitsMap = new Map(branchIds.map((id, i) => [id, benefits[i]]));

    const tierStateMap = new Map(tierStates.map((t) => [t.branchId, t]));

    // 🔥 obtener tiers únicos
    const tierIds = Array.from(
      new Set(
        tierStates
          .map((t) => t.currentTierId)
          .filter((id): id is string => id !== null), // 🔥 CLAVE
      ),
    );

    const tiers = await Promise.all(
      tierIds.map((id) => this.tiersRepo.findById(id)),
    );

    const tierMap = new Map(tiers.map((t) => [t?.id, t]));

    // =========================
    // 3. build
    // =========================
    const response: repo.UserBenefitsWalletItem[] = [];

    let globalGiftCardCents = 0;

    for (const branchId of branchIds) {
      const branch = branchMap.get(branchId);
      if (!branch) continue;

      const balance = balances.find((b) => b.branchId === branchId);

      const imgs = imagesMap.get(branchId) ?? [];
      const b = benefitsMap.get(branchId);

      const cover =
        imgs.find((i) => i.isCover) ??
        imgs.sort((a, b) => a.position - b.position)[0];

      const totalGiftCardCents =
        b?.giftCards.reduce((acc, g) => acc + g.balanceCents, 0) ?? 0;

      globalGiftCardCents += totalGiftCardCents;

      const bestCoupon =
        b?.coupons?.slice().sort((a, b) => {
          if (a.type === 'percentage' && b.type === 'fixed') return -1;
          if (a.type === 'fixed' && b.type === 'percentage') return 1;
          return b.value - a.value;
        })[0] ?? null;

      // =========================
      // 🔥 TIER
      // =========================
      const tierState = tierStateMap.get(branchId);
      const tierEntity =
        tierState?.currentTierId != null
          ? tierMap.get(tierState.currentTierId)
          : null;

      response.push({
        points: balance?.pointsBalance ?? 0,

        branch: {
          id: branch.id,
          name: branch.name,
          address: branch.address,
          slug: branch.publicSlug,
          coverUrl: cover?.url ?? null,
        },

        benefits: {
          hasGiftCard: totalGiftCardCents > 0,
          totalGiftCardCents,
          bestCoupon: bestCoupon
            ? {
                type: bestCoupon.type,
                value: bestCoupon.value,
              }
            : null,
        },

        // 🔥 NUEVO
        tier: tierEntity
          ? {
              name: tierEntity.name,
              color: tierEntity.color,
              icon: tierEntity.icon,
            }
          : null,
      });
    }

    const result: UserWalletSummaryResponse = {
      global: {
        totalGiftCardCents: globalGiftCardCents,
      },
      branches: response,
    };

    await this.cache.set(cacheKey, result, 60);

    return result;
  }
}
