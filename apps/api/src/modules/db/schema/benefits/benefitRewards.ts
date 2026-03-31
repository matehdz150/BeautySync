import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { benefitPrograms } from './benefitPrograms';

export const benefitRewards = pgTable('benefit_rewards', {
  id: uuid('id').defaultRandom().primaryKey(),

  programId: uuid('program_id')
    .notNull()
    .references(() => benefitPrograms.id),

  type: text('type', {
    enum: ['SERVICE', 'PRODUCT', 'COUPON', 'GIFT_CARD', 'CUSTOM'],
  }).notNull(),

  referenceId: uuid('reference_id'), // 👈 clave

  name: text('name').notNull(),

  pointsCost: integer('points_cost').notNull(),

  isActive: boolean('is_active').default(true).notNull(),

  stock: integer('stock'), // null = infinito

  config: jsonb('config'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
