import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
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

import { DB } from 'src/modules/db/client';
import { Queue } from 'bullmq';

@Injectable()
export class DeleteTierUseCase {
  constructor(
    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepo: BenefitProgramRepository,

    @Inject(BENEFIT_TIERS_REPOSITORY)
    private readonly tiersRepo: BenefitTiersRepository,

    @Inject(TIER_REWARDS_REPOSITORY)
    private readonly rewardsRepo: TierRewardsRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,

    @Inject('DB')
    private readonly db: DB,

    @Inject('TIERS_QUEUE')
    private readonly queue: Queue,
  ) {}

  async execute(input: {
    tierId: string;
    branchId: string;
    user: AuthenticatedUser;
  }) {
    const { tierId, branchId, user } = input;

    // =========================
    // 🔥 ACCESS CONTROL
    // =========================
    const branch = await this.branchesRepo.findById(branchId);

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('No tienes acceso a esta sucursal');
    }

    // =========================
    // PROGRAM
    // =========================
    const program = await this.programRepo.findByBranchId(branchId);

    if (!program || !program.isActive) {
      throw new BadRequestException('No active benefit program');
    }

    // =========================
    // TIER
    // =========================
    const tier = await this.tiersRepo.findById(tierId);

    if (!tier) {
      throw new NotFoundException('Tier not found');
    }

    if (tier.programId !== program.id) {
      throw new BadRequestException('Tier does not belong to branch');
    }

    // =========================
    // DELETE FLOW
    // =========================
    await this.db.transaction(async (tx) => {
      // 1. eliminar rewards
      await this.rewardsRepo.deleteByTier(tierId, tx);

      // 2. eliminar tier
      await this.tiersRepo.delete(tierId, tx);

      // 3. 🔥 reordenar posiciones
      const remaining = await this.tiersRepo.getByProgram(program.id, tx);

      const sorted = [...remaining].sort((a, b) => a.position - b.position);

      for (let i = 0; i < sorted.length; i++) {
        await this.tiersRepo.update(sorted[i].id, { position: i + 1 }, tx);
      }
    });

    // =========================
    // 🔥 RECALCULAR USERS
    // =========================
    await this.queue.add(
      'tiers.recalculate',
      { branchId },
      {
        removeOnComplete: true,
        jobId: `tiers-recalculate-${branchId}-${Date.now()}`,
      },
    );

    return {
      success: true,
      tierId,
    };
  }
}
