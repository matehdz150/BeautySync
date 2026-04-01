import { Inject, Injectable } from '@nestjs/common';
import {
  BENEFIT_PROGRAM_REPOSITORY,
  BENEFIT_RULE_REPOSITORY,
} from '../ports/tokens';
import { BenefitProgramRepository } from '../ports/benefit-program.repository';
import { BenefitRuleRepository } from '../ports/benefit-rule.repository';
import { BenefitRuleEngine } from '../engine/benefit-rule-engine.service';
import { ProcessRuleInput } from '../engine/ types';

export type ProcessReviewBenefitsInput = {
  reviewId: string;
  userId: string;
  branchId: string;
};

@Injectable()
export class ProcessReviewBenefitsUseCase {
  constructor(
    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepo: BenefitProgramRepository,

    @Inject(BENEFIT_RULE_REPOSITORY)
    private readonly ruleRepo: BenefitRuleRepository,

    private readonly engine: BenefitRuleEngine,
  ) {}

  async execute(input: ProcessReviewBenefitsInput) {
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
    // 3. FILTRAR SOLO REVIEW
    // =========================
    const reviewRules = rules.filter((rule) => rule.type === 'REVIEW_CREATED');

    if (!reviewRules.length) return;

    // =========================
    // 4. MAPEAR A ENGINE INPUT
    // =========================
    const engineInputs: ProcessRuleInput[] = reviewRules.map((rule) => ({
      userId: input.userId,
      branchId: input.branchId,
      rule,
      context: {
        reviewId: input.reviewId,
      },
    }));

    // =========================
    // 5. EJECUTAR ENGINE
    // =========================
    await this.engine.processRules(engineInputs);
  }
}
