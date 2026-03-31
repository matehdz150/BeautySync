// drizzle/schema/coupons.ts
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    branchId: uuid('branch_id').notNull(),

    code: text('code').notNull(),

    // 🔥 TYPE
    type: text('type', {
      enum: ['percentage', 'fixed'],
    }).notNull(),

    value: integer('value').notNull(), // % o cents

    // 🔥 RULES
    minAmountCents: integer('min_amount_cents'),
    maxDiscountCents: integer('max_discount_cents'),

    usageLimit: integer('usage_limit'),
    usedCount: integer('used_count').notNull().default(0),

    assignedToUserId: uuid('assigned_to_user_id'),

    expiresAt: timestamp('expires_at'),

    isActive: boolean('is_active').notNull().default(true),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    codeBranchIdx: uniqueIndex('coupons_code_branch_idx').on(
      table.code,
      table.branchId,
    ),
  }),
);
