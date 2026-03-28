// drizzle/schema.ts

import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const publicUserFavorites = pgTable(
  'public_user_favorites',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id').notNull(),
    branchId: uuid('branch_id').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    unique: uniqueIndex('user_branch_unique').on(table.userId, table.branchId),
  }),
);
