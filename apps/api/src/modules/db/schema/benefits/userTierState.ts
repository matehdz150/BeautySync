import { pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const userTierState = pgTable(
  'user_tier_state',
  {
    userId: uuid('user_id').notNull(),
    branchId: uuid('branch_id').notNull(),

    currentTierId: uuid('current_tier_id'),

    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userBranchUnique: uniqueIndex('user_branch_unique').on(
      table.userId,
      table.branchId,
    ),
  }),
);
