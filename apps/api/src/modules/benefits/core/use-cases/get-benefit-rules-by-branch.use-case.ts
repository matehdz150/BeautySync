// core/use-cases/get-benefit-rules-by-branch.use-case.ts

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  BENEFIT_PROGRAM_REPOSITORY,
  BENEFIT_RULE_REPOSITORY,
} from '../ports/tokens';
import { BenefitRuleRepository } from '../ports/benefit-rule.repository';

import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';
import { BenefitProgramRepository } from '../ports/benefit-program.repository';

@Injectable()
export class GetBenefitRulesByBranchUseCase {
  constructor(
    @Inject(BENEFIT_RULE_REPOSITORY)
    private readonly ruleRepo: BenefitRuleRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,

    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepo: BenefitProgramRepository,
  ) {}

  async execute(input: { branchId: string; user: AuthenticatedUser }) {
    // =========================
    // ACCESS
    // =========================
    const branch = await this.branchesRepo.findById(input.branchId);

    if (!branch) {
      throw new BadRequestException('Sucursal inválida');
    }

    if (!input.user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('Sin acceso');
    }

    // =========================
    // PROGRAM
    // =========================
    const program = await this.programRepo.findByBranchId(input.branchId);

    // =========================
    // RULES
    // =========================
    const rules = program?.isActive
      ? await this.ruleRepo.findActiveByBranch(input.branchId)
      : [];

    return {
      program: {
        exists: !!program,
        isActive: program?.isActive ?? false,
        name: program?.name ?? null,
      },
      rules,
    };
  }
}
