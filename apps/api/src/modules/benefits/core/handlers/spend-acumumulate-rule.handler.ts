import { Inject, Injectable } from '@nestjs/common';
import {
  BenefitEarnRuleType,
  BenefitRuleHandler,
} from '../engine/benefit-rule-handler.interface';
import { BenefitProgressRepository } from '../ports/benefit-progress.repository';
import {
  BENEFIT_POINTS_REPOSITORY,
  BENEFIT_PROGRESS_REPOSITORY,
} from '../ports/tokens';
import { BenefitPointsRepository } from '../ports/benefit-points.repository';
import { ProcessRuleInput } from '../engine/types';

@Injectable()
export class SpendAccumulatedRuleHandler implements BenefitRuleHandler {
  constructor(
    @Inject(BENEFIT_PROGRESS_REPOSITORY)
    private readonly progressRepo: BenefitProgressRepository,

    @Inject(BENEFIT_POINTS_REPOSITORY)
    private readonly pointsRepo: BenefitPointsRepository,
  ) {}

  supports(type: BenefitEarnRuleType) {
    return type === 'SPEND_ACCUMULATED';
  }

  async process(input: ProcessRuleInput) {
    const config = input.rule.config as {
      thresholdCents: number;
      points: number;
    };

    if (!input.context.amountCents) return;

    const progress = await this.progressRepo.getProgress({
      userId: input.userId,
      ruleId: input.rule.id,
    });

    const newValue = progress.progressValue + input.context.amountCents;

    const idempotencyKey = `earn:spend:${input.rule.id}:${input.context.bookingId}:${input.userId}`;

    if (newValue >= config.thresholdCents) {
      await this.pointsRepo.addPoints({
        userId: input.userId,
        branchId: input.branchId,
        points: config.points,
        source: 'EARN_RULE',
        referenceId: input.context.bookingId,
        idempotencyKey,
      });

      await this.progressRepo.resetProgress({
        userId: input.userId,
        ruleId: input.rule.id,
      });
    } else {
      await this.progressRepo.incrementProgress({
        userId: input.userId,
        ruleId: input.rule.id,
        value: input.context.amountCents,
      });
    }
  }
}
