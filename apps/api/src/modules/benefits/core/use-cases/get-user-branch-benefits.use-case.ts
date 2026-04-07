import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';
import {
  BENEFIT_BALANCE_REPOSITORY,
  BENEFIT_PROGRAM_REPOSITORY,
  BENEFIT_REWARD_REPOSITORY,
  BENEFIT_TIERS_REPOSITORY,
  USER_TIER_STATE_REPOSITORY,
} from '../ports/tokens';
import { BenefitBalanceRepository } from '../ports/benefit-balance.repository';
import { BenefitProgramRepository } from '../ports/benefit-program.repository';
import { BenefitRewardRepository } from '../ports/benefit-reward.repository';
import { BenefitTiersRepository } from '../ports/benefit-tier.repository';
import { UserTierStateRepository } from '../ports/user-tier-state.repository';
import { SERVICE_REPOSITORY } from 'src/modules/services/core/ports/tokens';
import { ServiceRepository } from 'src/modules/services/core/ports/service.repository';
import { PRODUCT_REPOSITORY } from 'src/modules/products/core/ports/tokens';
import { ProductRepository } from 'src/modules/products/core/ports/product.port';

@Injectable()
export class GetUserBranchBenefitsUseCase {
  constructor(
    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,

    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepo: BenefitProgramRepository,

    @Inject(BENEFIT_BALANCE_REPOSITORY)
    private readonly balanceRepo: BenefitBalanceRepository,

    @Inject(BENEFIT_TIERS_REPOSITORY)
    private readonly tiersRepo: BenefitTiersRepository,

    @Inject(USER_TIER_STATE_REPOSITORY)
    private readonly userTierStateRepo: UserTierStateRepository,

    @Inject(BENEFIT_REWARD_REPOSITORY)
    private readonly rewardRepo: BenefitRewardRepository,

    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepo: ServiceRepository,

    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(input: { branchId: string; userId: string }) {
    const { branchId, userId } = input;

    if (!branchId) throw new BadRequestException('branchId is required');
    if (!userId) throw new BadRequestException('userId is required');

    const branch = await this.branchesRepo.findById(branchId);
    if (!branch) throw new BadRequestException('Sucursal inválida');

    const program = await this.programRepo.findByBranchId(branchId);

    if (!program || !program.isActive) {
      return {
        program: {
          exists: !!program,
          isActive: program?.isActive ?? false,
          id: program?.id ?? null,
          name: program?.name ?? null,
        },
        points: 0,
        currentTier: null,
        nextTier: null,
        pointsToNextTier: 0,
        rewards: {
          all: [],
          available: [],
          unavailable: [],
        },
      };
    }

    const balance = await this.balanceRepo.getByUserAndBranch({
      userId,
      branchId,
    });
    const points = balance?.pointsBalance ?? 0;

    const [tiersRaw, rewardsRaw, userTierStates] = await Promise.all([
      this.tiersRepo.getByProgram(program.id),
      this.rewardRepo.findActiveByProgram(program.id),
      this.userTierStateRepo.getByUser(userId),
    ]);

    const tiers = [...tiersRaw].sort((a, b) => a.minPoints - b.minPoints);
    const stateForBranch =
      userTierStates.find((s) => s.branchId === branchId) ?? null;

    const inferredTier =
      tiers.filter((t) => points >= t.minPoints).slice(-1)[0] ?? null;

    const currentTier =
      tiers.find((t) => t.id === stateForBranch?.currentTierId) ?? inferredTier;

    const nextTier = tiers.find((t) => t.minPoints > points) ?? null;

    const pointsToNextTier = nextTier
      ? Math.max(nextTier.minPoints - points, 0)
      : 0;

    const normalizedRewards = await Promise.all(
      rewardsRaw.map(async (reward) => {
        const available = points >= reward.pointsCost;

        let service: Awaited<ReturnType<ServiceRepository['findById']>> = null;
        let product: Awaited<ReturnType<ProductRepository['findById']>> = null;

        if (reward.referenceId && reward.type === 'SERVICE') {
          service = await this.serviceRepo.findById(reward.referenceId);
        }

        if (reward.referenceId && reward.type === 'PRODUCT') {
          product = await this.productRepo.findById(reward.referenceId);
        }

        return {
          ...reward,
          service,
          product,
          available,
        };
      }),
    );

    return {
      program: {
        exists: true,
        isActive: true,
        id: program.id,
        name: program.name ?? null,
      },
      points,
      currentTier: currentTier
        ? {
            id: currentTier.id,
            name: currentTier.name,
            color: currentTier.color,
            icon: currentTier.icon,
            minPoints: currentTier.minPoints,
            position: currentTier.position,
          }
        : null,
      nextTier: nextTier
        ? {
            id: nextTier.id,
            name: nextTier.name,
            color: nextTier.color,
            icon: nextTier.icon,
            minPoints: nextTier.minPoints,
            position: nextTier.position,
          }
        : null,
      pointsToNextTier,
      rewards: {
        all: normalizedRewards,
        available: normalizedRewards.filter((r) => r.available),
        unavailable: normalizedRewards.filter((r) => !r.available),
      },
    };
  }
}
