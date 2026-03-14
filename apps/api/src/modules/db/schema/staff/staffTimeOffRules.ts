import {
  pgTable,
  serial,
  uuid,
  text,
  timestamp,
  time,
  integer,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { staff } from './staff';

export const recurrenceTypeEnum = pgEnum('timeoff_recurrence_type', [
  'NONE',
  'DAILY',
  'WEEKLY',
]);

export const staffTimeOffRules = pgTable(
  'staff_time_off_rules',
  {
    id: serial('id').primaryKey(),

    staffId: uuid('staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'cascade' }),

    recurrenceType: recurrenceTypeEnum('recurrence_type').notNull(),

    // para weekly
    daysOfWeek: integer('days_of_week').array(),

    // horas dentro del día
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),

    // rango de la regla
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }),

    reason: text('reason'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },

  (table) => ({
    ruleStaffIdx: index('staff_timeoff_rules_staff_idx').on(table.staffId),
  }),
);
