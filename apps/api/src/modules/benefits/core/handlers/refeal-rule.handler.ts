import { Inject, Injectable } from '@nestjs/common';
import {
  BenefitEarnRuleType,
  BenefitRuleHandler,
} from '../engine/benefit-rule-handler.interface';
import { BENEFIT_POINTS_REPOSITORY } from '../ports/tokens';
import { BenefitPointsRepository } from '../ports/benefit-points.repository';
import { ProcessRuleInput } from '../engine/ types';

@Injectable()
export class ReferralRuleHandler implements BenefitRuleHandler {
  constructor(
    @Inject(BENEFIT_POINTS_REPOSITORY)
    private readonly pointsRepo: BenefitPointsRepository,
  ) {}

  supports(type: BenefitEarnRuleType) {
    return type === 'REFERRAL';
  }

  async process(input: ProcessRuleInput) {
    if (!input.context.referredUserId) return;

    const config = input.rule.config as {
      points: number;
    };

    const idempotencyKey = `earn:referral:${input.rule.id}:${input.context.referredUserId}:${input.userId}`;
    await this.pointsRepo.addPoints({
      userId: input.userId,
      branchId: input.branchId,
      points: config.points,
      source: 'EARN_RULE',
      referenceId: input.context.referredUserId,
      idempotencyKey,
    });
  }
}
