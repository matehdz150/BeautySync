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
    // id del appointment / product / coupon etc

    label: text('label').notNull(),

    amountCents: integer('amount_cents').notNull(),
    // positivo = cargo
    // negativo = descuento

    /* =====================
       STAFF ASOCIADO
    ===================== */

    staffId: uuid('staff_id'),

    /* =====================
       METADATA FLEXIBLE
    ===================== */

    meta: jsonb('meta'),
    // ej:
    // { durationMin, serviceName, color, couponCode }

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    /* =====================
       ÍNDICES
    ===================== */

    paymentIdx: index('payment_items_payment_idx').on(table.paymentId),

    typeIdx: index('payment_items_type_idx').on(table.type),

    staffIdx: index('payment_items_staff_idx').on(table.staffId),

    referenceIdx: index('payment_items_reference_idx').on(table.referenceId),

    createdIdx: index('payment_items_created_idx').on(table.createdAt),
  }),
);
