import {
  pgTable,
  uuid,
  boolean,
  text,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { branches } from '../branches';

export const benefitPrograms = pgTable(
  'benefit_programs',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),

    isActive: boolean('is_active').default(false).notNull(),

    name: text('name'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    branchIdx: index('benefit_programs_branch_idx').on(t.branchId),

    // 🔥 si solo hay 1 programa activo por branch (recomendado)
    uniqueBranch: uniqueIndex('benefit_programs_branch_unique').on(t.branchId),
  }),
);
