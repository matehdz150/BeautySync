import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  BENEFIT_PROGRAM_REPOSITORY,
  BENEFIT_RULE_CONFIG_VALIDATORS,
  BENEFIT_RULE_REPOSITORY,
} from '../ports/tokens';

import { BenefitProgramRepository } from '../ports/benefit-program.repository';
import { BenefitRuleRepository } from '../ports/benefit-rule.repository';
import { BenefitRuleConfigValidator } from '../validators/benefit-rule-config.validator.interface';
import { BenefitEarnRuleType } from '../engine/benefit-rule-handler.interface';
import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

@Injectable()
export class UpdateBenefitEarnRuleUseCase {
  constructor(
    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepo: BenefitProgramRepository,

    @Inject(BENEFIT_RULE_REPOSITORY)
    private readonly ruleRepo: BenefitRuleRepository,

    @Inject(BENEFIT_RULE_CONFIG_VALIDATORS)
    private readonly validators: BenefitRuleConfigValidator[],
  ) {}

  async execute(input: {
    ruleId: string;
    branchId: string;

    type?: BenefitEarnRuleType;
    config?: unknown;
    isActive?: boolean;
    user: AuthenticatedUser;
  }) {
    // =========================
    // 1. PROGRAMA
    // =========================
    const program = await this.programRepo.findByBranchId(input.branchId);

    if (!program || !program.isActive) {
      throw new BadRequestException('No active benefit program');
    }

    // =========================
    // 2. REGLA
    // =========================
    const rule = await this.ruleRepo.findById(input.ruleId);

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    if (rule.programId !== program.id) {
      throw new BadRequestException('Rule does not belong to this program');
    }

    // =========================
    // 3. VALIDACIÓN CONFIG
    // =========================
    let validatedConfig = rule.config;
    let type = rule.type;

    if (input.type) {
      type = input.type;
    }

    if (input.config) {
      const validator = this.validators.find((v) => v.supports(type));

      if (!validator) {
        throw new BadRequestException('Unsupported rule type');
      }

      validatedConfig = validator.validate(input.config);
    }

    // =========================
    // 4. UPDATE
    // =========================
    return this.ruleRepo.update(input.ruleId, {
      type,
      config: validatedConfig,
      isActive: input.isActive ?? rule.isActive,
    });
  }
}
