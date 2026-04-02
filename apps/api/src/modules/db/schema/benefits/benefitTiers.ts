import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const benefitTiers = pgTable('benefit_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),

  programId: uuid('program_id').notNull(),

  name: text('name').notNull(),
  description: text('description'),

  color: text('color'),
  icon: text('icon'),

  minPoints: integer('min_points').notNull(),

  position: integer('position').notNull(),

  createdAt: timestamp('created_at').defaultNow(),
});
