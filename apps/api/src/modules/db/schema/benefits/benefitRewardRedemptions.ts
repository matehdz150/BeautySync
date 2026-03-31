import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { benefitRewards } from './benefitRewards';
import { publicUsers } from '../public';
import { branches } from '../branches';

export const benefitRewardRedemptions = pgTable('benefit_reward_redemptions', {
  id: uuid('id').defaultRandom().primaryKey(),

  rewardId: uuid('reward_id')
    .notNull()
    .references(() => benefitRewards.id),

  userId: uuid('user_id')
    .notNull()
    .references(() => publicUsers.id),

  branchId: uuid('branch_id')
    .notNull()
    .references(() => branches.id),

  pointsSpent: integer('points_spent').notNull(),

  status: text('status').notNull(), // CONFIRMED, PENDING, CANCELLED

  referenceCode: text('reference_code').notNull(),

  metadata: jsonb('metadata'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});
