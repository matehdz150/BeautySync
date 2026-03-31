import {
  boolean,
  index,
  jsonb,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { benefitEarnRuleTypeEnum } from './benefits-enums';
import { benefitPrograms } from './benefitPrograms';

export const benefitEarnRules = pgTable(
  'benefit_earn_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    programId: uuid('program_id')
      .notNull()
      .references(() => benefitPrograms.id),

    type: benefitEarnRuleTypeEnum('type').notNull(),

    isActive: boolean('is_active').default(true).notNull(),

    config: jsonb('config').notNull(), // 🔥 clave flexible

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    programIdx: index('benefit_earn_rules_program_idx').on(t.programId),

    activeIdx: index('benefit_earn_rules_active_idx').on(
      t.programId,
      t.isActive,
    ),

    typeIdx: index('benefit_earn_rules_type_idx').on(t.type),
  }),
);
