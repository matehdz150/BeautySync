import {
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { publicUsers } from '../public';
import { benefitEarnRules } from './benefitEarnRules';

export const benefitUserProgress = pgTable(
  'benefit_user_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => publicUsers.id),

    ruleId: uuid('rule_id')
      .notNull()
      .references(() => benefitEarnRules.id),

    progressValue: integer('progress_value').default(0).notNull(),

    lastTriggeredAt: timestamp('last_triggered_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index('benefit_progress_user_idx').on(t.userId),

    ruleIdx: index('benefit_progress_rule_idx').on(t.ruleId),

    // 🔥 CRÍTICO (lookup principal)
    userRuleIdx: uniqueIndex('benefit_progress_user_rule_unique').on(
      t.userId,
      t.ruleId,
    ),
  }),
);
