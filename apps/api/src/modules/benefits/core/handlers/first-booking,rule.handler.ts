import { Inject, Injectable } from '@nestjs/common';
import {
  BenefitEarnRuleType,
  BenefitRuleHandler,
} from '../engine/benefit-rule-handler.interface';
import {
  BENEFIT_POINTS_REPOSITORY,
  BENEFIT_PROGRESS_REPOSITORY,
} from '../ports/tokens';
import { BenefitProgressRepository } from '../ports/benefit-progress.repository';
import { BenefitPointsRepository } from '../ports/benefit-points.repository';
import { ProcessRuleInput } from '../engine/ types';

@Injectable()
export class FirstBookingRuleHandler implements BenefitRuleHandler {
  constructor(
    @Inject(BENEFIT_PROGRESS_REPOSITORY)
    private readonly progressRepo: BenefitProgressRepository,

    @Inject(BENEFIT_POINTS_REPOSITORY)
    private readonly pointsRepo: BenefitPointsRepository,
  ) {}

  supports(type: BenefitEarnRuleType) {
    return type === 'FIRST_BOOKING';
  }

  async process(input: ProcessRuleInput) {
    const progress = await this.progressRepo.getProgress({
      userId: input.userId,
      ruleId: input.rule.id,
    });

    if (progress.progressValue > 0) return; // ya se dio

    const config = input.rule.config as {
      points: number;
    };

    const idempotencyKey = `earn:first_booking:${input.rule.id}:${input.userId}`;

    await this.pointsRepo.addPoints({
      userId: input.userId,
      branchId: input.branchId,
      points: config.points,
      source: 'EARN_RULE',
      referenceId: input.context.bookingId,
      idempotencyKey,
    });

    await this.progressRepo.incrementProgress({
      userId: input.userId,
      ruleId: input.rule.id,
      value: 1,
    });
  }
}
