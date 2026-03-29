import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { branches } from '../branches';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),

  branchId: uuid('branch_id')
    .notNull()
    .references(() => branches.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  slug: text('slug').notNull(),

  description: text('description'),

  priceCents: integer('price_cents').notNull(),
  costCents: integer('cost_cents'),

  sku: text('sku'),

  imageUrl: text('image_url'),

  isActive: boolean('is_active').default(true).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
