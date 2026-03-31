import { Inject, Injectable } from '@nestjs/common';
import { BENEFIT_PROGRAM_REPOSITORY } from '../ports/tokens';
import { BENEFIT_RULE_REPOSITORY } from '../ports/tokens';
import { BenefitProgramRepository } from '../ports/benefit-program.repository';
import {
  BenefitRuleRepository,
  ProcessBookingBenefitsInput,
} from '../ports/benefit-rule.repository';
import { BenefitRuleEngine } from '../engine/benefit-rule-engine.service';
import { ProcessRuleInput } from '../engine/ types';

@Injectable()
export class ProcessBookingBenefitsUseCase {
  constructor(
    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepo: BenefitProgramRepository,

    @Inject(BENEFIT_RULE_REPOSITORY)
    private readonly ruleRepo: BenefitRuleRepository,

    private readonly engine: BenefitRuleEngine,
  ) {}

  async execute(input: ProcessBookingBenefitsInput) {
    // =========================
    // 1. PROGRAMA ACTIVO
    // =========================
    const program = await this.programRepo.findByBranchId(input.branchId);

    if (!program || !program.isActive) return;

    // =========================
    // 2. REGLAS ACTIVAS
    // =========================
    const rules = await this.ruleRepo.findActiveByBranch(input.branchId);

    if (!rules.length) return;

    // =========================
    // 3. MAPEAR A ENGINE INPUT
    // =========================
    const engineInputs: ProcessRuleInput[] = rules.map((rule) => ({
      userId: input.userId,
      branchId: input.branchId,
      rule,
      context: {
        bookingId: input.bookingId,
        amountCents: input.amountCents,
        isOnline: input.isOnline,
      },
    }));

    // =========================
    // 4. EJECUTAR ENGINE
    // =========================
    await this.engine.processRules(engineInputs);
  }
}
