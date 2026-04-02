import { Inject, Injectable } from '@nestjs/common';
import {
  BenefitRuleHandler,
  BenefitEarnRuleType,
} from '../engine/benefit-rule-handler.interface';
import { ProcessRuleInput } from '../engine/types';
import { BENEFIT_PROGRESS_REPOSITORY } from '../ports/tokens';
import { BENEFIT_POINTS_REPOSITORY } from '../ports/tokens';
import { BenefitProgressRepository } from '../ports/benefit-progress.repository';
import { BenefitPointsRepository } from '../ports/benefit-points.repository';

@Injectable()
export class BookingCountRuleHandler implements BenefitRuleHandler {
  constructor(
    @Inject(BENEFIT_PROGRESS_REPOSITORY)
    private readonly progressRepo: BenefitProgressRepository,

    @Inject(BENEFIT_POINTS_REPOSITORY)
    private readonly pointsRepo: BenefitPointsRepository,
  ) {}

  supports(type: BenefitEarnRuleType) {
    return type === 'BOOKING_COUNT';
  }

  async process(input: ProcessRuleInput) {
    const config = input.rule.config as {
      count: number;
      points: number;
    };

    const progress = await this.progressRepo.getProgress({
      userId: input.userId,
      ruleId: input.rule.id,
    });

    const newValue = progress.progressValue + 1;

    const idempotencyKey = `earn:booking_count:${input.rule.id}:${input.context.bookingId}:${input.userId}`;
    if (newValue >= config.count) {
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
        value: 1,
      });
    }
  }
}
