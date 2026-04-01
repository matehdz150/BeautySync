// core/entities/benefit-rule.entity.ts

import { BenefitEarnRuleType } from '../engine/benefit-rule-handler.interface';

export type BenefitRuleType =
  | 'BOOKING_COUNT'
  | 'SPEND_ACCUMULATED'
  | 'REVIEW_CREATED'
  | 'ONLINE_PAYMENT';

export type BenefitEarnRuleEntity = {
  id: string;
  programId: string;
  type: BenefitEarnRuleType;
  isActive: boolean;
  config: Record<string, unknown>;

  isValid(): boolean;
};
