import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  BENEFIT_PROGRAM_REPOSITORY,
  BENEFIT_TIERS_REPOSITORY,
  TIER_REWARDS_REPOSITORY,
} from '../../ports/tokens';

import { BenefitProgramRepository } from '../../ports/benefit-program.repository';
import { BenefitTiersRepository } from '../../ports/benefit-tier.repository';
import { TierRewardsRepository } from '../../ports/tier-reward.repository';

import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

@Injectable()
export class GetTierByIdUseCase {
  constructor(
    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepo: BenefitProgramRepository,

    @Inject(BENEFIT_TIERS_REPOSITORY)
    private readonly tiersRepo: BenefitTiersRepository,

    @Inject(TIER_REWARDS_REPOSITORY)
    private readonly rewardsRepo: TierRewardsRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
  ) {}

  async execute(input: { tierId: string; user: AuthenticatedUser }) {
    const { tierId, user } = input;

    // 🔥 SINGLE QUERY
    const ctx = await this.tiersRepo.findByIdWithContext(tierId);

    if (!ctx) {
      throw new NotFoundException('Tier not found');
    }

    const { tier, program, branch } = ctx;

    // =========================
    // VALIDACIONES
    // =========================
    if (!program.isActive) {
      throw new NotFoundException('Benefit program not active');
    }

    if (!user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('No tienes acceso a este tier');
    }

    // =========================
    // REWARDS
    // =========================
    const rewards = await this.rewardsRepo.getByTier(tierId);

    // =========================
    // RESPONSE (NO CAMBIA FRONT)
    // =========================
    return {
      tier: {
        id: tier.id,
        programId: tier.programId,
        name: tier.name,
        description: tier.description ?? null,
        color: tier.color ?? null,
        icon: tier.icon ?? null,
        minPoints: tier.minPoints,
        position: tier.position,
        createdAt: tier.createdAt,
      },
      rewards,
    };
  }
}
