import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import {
  BENEFIT_RULE_REPOSITORY,
  BENEFIT_PROGRAM_REPOSITORY,
} from '../ports/tokens';

import { BenefitRuleRepository } from '../ports/benefit-rule.repository';
import { BenefitProgramRepository } from '../ports/benefit-program.repository';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';
import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';

@Injectable()
export class GetBenefitRuleByIdUseCase {
  constructor(
    @Inject(BENEFIT_RULE_REPOSITORY)
    private readonly ruleRepo: BenefitRuleRepository,

    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepo: BenefitProgramRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
  ) {}

  async execute(input: {
    ruleId: string;
    branchId: string;
    user: AuthenticatedUser;
  }) {
    // =========================
    // 1. BRANCH + ACCESS
    // =========================
    const branch = await this.branchesRepo.findById(input.branchId);

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!input.user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('No tienes acceso a esta sucursal');
    }

    // =========================
    // 2. PROGRAM
    // =========================
    const program = await this.programRepo.findByBranchId(input.branchId);

    if (!program || !program.isActive) {
      throw new NotFoundException('Program not found');
    }

    // =========================
    // 3. RULE
    // =========================
    const rule = await this.ruleRepo.findById(input.ruleId);

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    if (rule.programId !== program.id) {
      throw new BadRequestException('Rule does not belong to this branch');
    }

    return rule;
  }
}
