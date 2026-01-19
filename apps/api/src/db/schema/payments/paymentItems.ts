import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { paymentItemTypeEnum, payments } from './payment';

export const paymentItems = pgTable(
  'payment_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    paymentId: uuid('payment_id')
      .notNull()
      .references(() => payments.id, { onDelete: 'cascade' }),

    /* =====================
       ITEM
    ===================== */
    type: paymentItemTypeEnum('type').notNull(),

    referenceId: uuid('reference_id'),
    // id del service/product original (opcional)

    label: text('label').notNull(),

    amountCents: integer('amount_cents').notNull(),
    // +cargo | -descuento

    /* =====================
       STAFF ASOCIADO AL ITEM
    ===================== */
    staffId: uuid('staff_id'),

    /* =====================
       METADATA FLEXIBLE
    ===================== */
    meta: jsonb('meta'),
    // { color, durationMin, icon, etc }

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    /* =====================
       ÍNDICES PARA ANALYTICS
    ===================== */

    paymentIdx: index('payment_items_payment_idx').on(table.paymentId),

    typeIdx: index('payment_items_type_idx').on(table.type),

    staffIdx: index('payment_items_staff_idx').on(table.staffId),

    referenceIdx: index('payment_items_reference_idx').on(table.referenceId),
  }),
);
