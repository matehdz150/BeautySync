import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const benefitTierRewards = pgTable('benefit_tier_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),

  tierId: uuid('tier_id').notNull(),

  type: text('type', {
    enum: ['ONE_TIME', 'RECURRING'],
  }).notNull(),

  config: jsonb('config').notNull(),

  createdAt: timestamp('created_at').defaultNow(),
});
