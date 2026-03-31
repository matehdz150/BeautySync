import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { benefitPointsSourceEnum } from './benefits-enums';
import { publicUsers } from '../public/public-users';
import { branches } from '../branches/branches';

export const benefitPointsLedger = pgTable(
  'benefit_points_ledger',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => publicUsers.id),

    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),

    points: integer('points').notNull(), // + o -

    source: benefitPointsSourceEnum('source').notNull(),

    referenceId: text('reference_id'), // bookingId, reviewId, etc

    metadata: jsonb('metadata'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index('benefit_points_user_idx').on(t.userId),

    branchIdx: index('benefit_points_branch_idx').on(t.branchId),

    sourceIdx: index('benefit_points_source_idx').on(t.source),

    // 🔥 feed del usuario
    userCreatedIdx: index('benefit_points_user_created_idx').on(
      t.userId,
      t.createdAt,
    ),

    // 🔥 auditoría por referencia (booking, etc)
    referenceIdx: index('benefit_points_reference_idx').on(t.referenceId),
  }),
);
