import { BenefitEarnRuleEntity } from '../entities/benefit-rule.entity';

export type BenefitEventContext = {
  bookingId?: string;
  amountCents?: number;
  isOnline?: boolean;
  reviewId?: string;
  referredUserId?: string;
};

export type ProcessRuleInput = {
  userId: string;
  branchId: string;
  rule: BenefitEarnRuleEntity;
  context: BenefitEventContext;
};

export type BenefitRewardType =
  | 'SERVICE'
  | 'PRODUCT'
  | 'COUPON'
  | 'GIFT_CARD'
  | 'CUSTOM';

export type RedeemRewardInput = {
  userId: string;
  branchId: string;

  reward: {
    id: string;
    type: BenefitRewardType;
    referenceId?: string | null;
    config?: Record<string, unknown>;
  };

  context: {
    bookingId?: string;
  };
};
