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

export interface UserBenefitsSummary {
  points: number;
  branch: {
    id: string;
    name: string;
    address: string | null;
    slug: string | null;
    coverUrl: string | null;
  } | null;
}

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

    @Inject(CACHE_PORT)
    private readonly cache: cachePort.CachePort,
  ) {}

  async execute(userId: string): Promise<repo.UserBenefitsWalletItem[]> {
    const cacheKey = `benefits:wallet:${userId}`;

    const cached =
      await this.cache.get<repo.UserBenefitsWalletItem[]>(cacheKey);
    if (cached) return cached;

    // =========================
    // 1. balances
    // =========================
    const balances = await this.balanceRepo.getAllUserBalances(userId);

    // 👇 obtener branches donde tiene beneficios aunque no tenga puntos
    const benefitBranches =
      await this.paymentsRepo.getUserBenefitBranchIds(userId);

    // 👇 unir ambos
    const allBranchIds = Array.from(
      new Set([...balances.map((b) => b.branchId), ...benefitBranches]),
    );

    if (!allBranchIds.length) return [];

    const branchIds = allBranchIds;

    // =========================
    // 2. parallel
    // =========================
    const [branches, images, benefits] = await Promise.all([
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
    ]);

    const branchMap = new Map(branches.map((b) => [b?.id, b]));
    const imagesMap = new Map(branchIds.map((id, i) => [id, images[i]]));
    const benefitsMap = new Map(branchIds.map((id, i) => [id, benefits[i]]));

    // =========================
    // 3. build
    // =========================
    const response: repo.UserBenefitsWalletItem[] = [];

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

      const bestCoupon =
        b?.coupons?.slice().sort((a, b) => {
          if (a.type === 'percentage' && b.type === 'fixed') return -1;
          if (a.type === 'fixed' && b.type === 'percentage') return 1;
          return b.value - a.value;
        })[0] ?? null;

      response.push({
        points: balance?.pointsBalance ?? 0, // 🔥 default 0

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
      });
    }

    await this.cache.set(cacheKey, response, 60);

    return response;
  }
}
