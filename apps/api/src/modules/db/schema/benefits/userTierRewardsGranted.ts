import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

export const userTierRewardsGranted = pgTable('user_tier_rewards_granted', {
  id: uuid('id').primaryKey().defaultRandom(),

  userId: uuid('user_id').notNull(),
  branchId: uuid('branch_id').notNull(),

  tierRewardId: uuid('tier_reward_id').notNull(),

  grantedAt: timestamp('granted_at').defaultNow(),
});
