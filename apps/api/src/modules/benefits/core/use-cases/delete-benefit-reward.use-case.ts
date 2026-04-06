import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { BENEFIT_REWARD_REPOSITORY } from '../ports/tokens';
import { BenefitRewardRepository } from '../ports/benefit-reward.repository';

import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

@Injectable()
export class DeleteBenefitRewardUseCase {
  constructor(
    @Inject(BENEFIT_REWARD_REPOSITORY)
    private readonly rewardRepo: BenefitRewardRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
  ) {}

  async execute(input: {
    rewardId: string;
    branchId: string;
    user: AuthenticatedUser;
  }) {
    // =========================
    // 1. REWARD
    // =========================
    const reward = await this.rewardRepo.findById(input.rewardId);

    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    // =========================
    // 2. BRANCH
    // =========================
    const branch = await this.branchesRepo.findById(input.branchId);

    if (!branch) {
      throw new BadRequestException('Sucursal inválida');
    }

    if (!input.user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('Sin acceso');
    }

    // =========================
    // 3. DELETE
    // =========================
    await this.rewardRepo.delete(input.rewardId);

    return { success: true };
  }
}
