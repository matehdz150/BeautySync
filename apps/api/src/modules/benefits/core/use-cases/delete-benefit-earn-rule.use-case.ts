import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import {
  BENEFIT_PROGRAM_REPOSITORY,
  BENEFIT_RULE_REPOSITORY,
} from '../ports/tokens';

import { BenefitProgramRepository } from '../ports/benefit-program.repository';
import { BenefitRuleRepository } from '../ports/benefit-rule.repository';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';
import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';

@Injectable()
export class DeleteBenefitEarnRuleUseCase {
  constructor(
    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepo: BenefitProgramRepository,

    @Inject(BENEFIT_RULE_REPOSITORY)
    private readonly ruleRepo: BenefitRuleRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
  ) {}

  async execute(input: {
    ruleId: string;
    branchId: string;
    user: AuthenticatedUser;
  }) {
    // =========================
    // 1. VALIDAR BRANCH + ACCESO
    // =========================
    const branch = await this.branchesRepo.findById(input.branchId);

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!input.user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('No tienes acceso a esta sucursal');
    }

    // =========================
    // 2. PROGRAMA ACTIVO
    // =========================
    const program = await this.programRepo.findByBranchId(input.branchId);

    if (!program || !program.isActive) {
      throw new BadRequestException('No active benefit program');
    }

    // =========================
    // 3. REGLA
    // =========================
    const rule = await this.ruleRepo.findById(input.ruleId);

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    if (rule.programId !== program.id) {
      throw new BadRequestException('Rule does not belong to this program');
    }

    // =========================
    // 4. DELETE
    // =========================

    // 👉 OPCIÓN A: HARD DELETE
    // await this.ruleRepo.delete(input.ruleId);

    // 👉 OPCIÓN B (RECOMENDADA): SOFT DELETE
    await this.ruleRepo.update(input.ruleId, {
      isActive: false,
    });

    return {
      success: true,
      ruleId: input.ruleId,
    };
  }
}
