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

import { BENEFIT_PROGRAM_REPOSITORY } from '../ports/tokens';
import { BenefitProgramRepository } from '../ports/benefit-program.repository';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';
import { ServiceRepository } from 'src/modules/services/core/ports/service.repository';
import { SERVICE_REPOSITORY } from 'src/modules/services/core/ports/tokens';
import { Service } from 'src/modules/services/core/entities/service.entity';

@Injectable()
export class GetBenefitRewardByIdUseCase {
  constructor(
    @Inject(BENEFIT_REWARD_REPOSITORY)
    private readonly rewardRepo: BenefitRewardRepository,

    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepo: BenefitProgramRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,

    @Inject(SERVICE_REPOSITORY)
    private readonly servicesRepo: ServiceRepository,
  ) {}

  async execute(input: { rewardId: string; user: AuthenticatedUser }) {
    const reward = await this.rewardRepo.findById(input.rewardId);

    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    const program = await this.programRepo.findById(reward.programId);

    if (!program) {
      throw new BadRequestException('Program not found');
    }

    const branch = await this.branchesRepo.findById(program.branchId);

    if (!branch) {
      throw new BadRequestException('Branch not found');
    }

    if (!input.user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('Sin acceso');
    }

    // =========================
    // 🔥 HYDRATE SERVICE
    // =========================
    let service: Service | null = null;

    if (reward.type === 'SERVICE' && reward.referenceId) {
      service = await this.servicesRepo.findById(reward.referenceId);
    }

    return {
      ...reward,
      service, // 👈 aquí ya viene el nombre, duración, etc
    };
  }
}
