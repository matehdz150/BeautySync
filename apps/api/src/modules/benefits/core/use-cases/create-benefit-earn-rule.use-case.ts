import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  BENEFIT_PROGRAM_REPOSITORY,
  BENEFIT_RULE_CONFIG_VALIDATORS,
  BENEFIT_RULE_REPOSITORY,
} from '../ports/tokens';
import { BenefitProgramRepository } from '../ports/benefit-program.repository';
import {
  BenefitRuleRepository,
  CreateBenefitEarnRuleInput,
} from '../ports/benefit-rule.repository';
import { BenefitRuleConfigValidator } from '../validators/benefit-rule-config.validator.interface';

@Injectable()
export class CreateBenefitEarnRuleUseCase {
  constructor(
    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepo: BenefitProgramRepository,

    @Inject(BENEFIT_RULE_REPOSITORY)
    private readonly ruleRepo: BenefitRuleRepository,

    @Inject(BENEFIT_RULE_CONFIG_VALIDATORS)
    private readonly validators: BenefitRuleConfigValidator[],
  ) {}

  async execute(input: CreateBenefitEarnRuleInput) {
    // =========================
    // 1. PROGRAMA
    // =========================
    const program = await this.programRepo.findByBranchId(input.branchId);

    if (!program || !program.isActive) {
      throw new BadRequestException('No active benefit program');
    }

    // =========================
    // 2. VALIDADOR
    // =========================
    const validator = this.validators.find((v) => v.supports(input.type));

    if (!validator) {
      throw new BadRequestException('Unsupported rule type');
    }

    const validatedConfig = validator.validate(input.config);

    // =========================
    // 3. CREAR REGLA
    // =========================
    return this.ruleRepo.create({
      programId: program.id,
      type: input.type,
      config: validatedConfig,
      isActive: true,
    });
  }
}
