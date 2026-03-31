import { pgEnum } from 'drizzle-orm/pg-core';

export const benefitEarnRuleTypeEnum = pgEnum('benefit_earn_rule_type', [
  'BOOKING_COUNT',
  'SPEND_ACCUMULATED',
  'REVIEW_CREATED',
  'ONLINE_PAYMENT',
  'FIRST_BOOKING',
  'REFERRAL',
]);

export const benefitPointsSourceEnum = pgEnum('benefit_points_source', [
  'EARN_RULE',
  'REWARD_REDEEM',
  'MANUAL_ADJUSTMENT',
  'EXPIRED',
]);
