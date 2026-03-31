import { Inject, Injectable } from '@nestjs/common';
import {
  BenefitEarnRuleType,
  BenefitRuleHandler,
} from '../engine/benefit-rule-handler.interface';
import { BENEFIT_POINTS_REPOSITORY } from '../ports/tokens';
import { BenefitPointsRepository } from '../ports/benefit-points.repository';
import { ProcessRuleInput } from '../engine/ types';

@Injectable()
export class OnlinePaymentRuleHandler implements BenefitRuleHandler {
  constructor(
    @Inject(BENEFIT_POINTS_REPOSITORY)
    private readonly pointsRepo: BenefitPointsRepository,
  ) {}

  supports(type: BenefitEarnRuleType) {
    return type === 'ONLINE_PAYMENT';
  }

  async process(input: ProcessRuleInput) {
    if (!input.context.isOnline) return;

    const config = input.rule.config as {
      points: number;
    };

    const idempotencyKey = `earn:online:${input.rule.id}:${input.context.bookingId}:${input.userId}`;
    await this.pointsRepo.addPoints({
      userId: input.userId,
      branchId: input.branchId,
      points: config.points,
      source: 'EARN_RULE',
      referenceId: input.context.bookingId,
      idempotencyKey,
    });
  }
}
