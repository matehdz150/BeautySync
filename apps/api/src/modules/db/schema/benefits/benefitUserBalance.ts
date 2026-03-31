import {
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { publicUsers } from '../public/public-users';
import { branches } from '../branches/branches';

export const benefitUserBalance = pgTable(
  'benefit_user_balance',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => publicUsers.id),

    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),

    pointsBalance: integer('points_balance').default(0).notNull(),

    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index('benefit_balance_user_idx').on(t.userId),

    branchIdx: index('benefit_balance_branch_idx').on(t.branchId),

    // 🔥 lookup principal
    userBranchUnique: uniqueIndex('benefit_balance_user_branch_unique').on(
      t.userId,
      t.branchId,
    ),
  }),
);
