import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  BENEFIT_PROGRAM_REPOSITORY,
  BENEFIT_TIERS_REPOSITORY,
} from '../../ports/tokens';

import { BenefitProgramRepository } from '../../ports/benefit-program.repository';
import { BenefitTiersRepository } from '../../ports/benefit-tier.repository';

import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

export interface BranchTierItem {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  minPoints: number;
}

@Injectable()
export class GetBranchTiersUseCase {
  constructor(
    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepo: BenefitProgramRepository,

    @Inject(BENEFIT_TIERS_REPOSITORY)
    private readonly tiersRepo: BenefitTiersRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
  ) {}

  async execute(input: {
    branchId: string;
    user: AuthenticatedUser;
  }): Promise<BranchTierItem[]> {
    const { branchId, user } = input;

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
      return [];
    }

    // =========================
    // TIERS
    // =========================
    const tiers = await this.tiersRepo.getByProgram(program.id);

    // =========================
    // RESPONSE
    // =========================
    return tiers
      .sort((a, b) => a.minPoints - b.minPoints)
      .map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        icon: t.icon,
        minPoints: t.minPoints,
      }));
  }
}
