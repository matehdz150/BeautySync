import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { publicBookings } from '../public/public-bookings';

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'card',
  'terminal',
  'transfer',
  'qr',
  'gift_card',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
  'cancelled',
]);

export const paymentItemTypeEnum = pgEnum('payment_item_type', [
  'service',
  'product',
  'discount',
  'fee',
  'tax',
]);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    /* =====================
       CONTEXTO
    ===================== */

    organizationId: uuid('organization_id').notNull(),

    branchId: uuid('branch_id').notNull(),

    clientId: uuid('client_id'),

    bookingId: uuid('booking_id').references(() => publicBookings.id, {
      onDelete: 'set null',
    }),

    cashierStaffId: uuid('cashier_staff_id').notNull(),

    /* =====================
       PAGO
    ===================== */

    paymentMethod: paymentMethodEnum('payment_method').notNull(),

    paymentProvider: text('payment_provider'),

    externalReference: text('external_reference'),

    status: paymentStatusEnum('status').notNull().default('pending'),

    /* =====================
       TOTALES (SNAPSHOT)
    ===================== */

    subtotalCents: integer('subtotal_cents').notNull(),

    discountsCents: integer('discounts_cents').notNull().default(0),

    taxCents: integer('tax_cents').notNull().default(0),

    totalCents: integer('total_cents').notNull(),

    /* =====================
       METADATA
    ===================== */

    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    paidAt: timestamp('paid_at', { withTimezone: true }),
  },
  (table) => ({
    /* =====================
       ÍNDICES PARA ESTADÍSTICAS
    ===================== */

    branchDateIdx: index('payments_branch_date_idx').on(
      table.branchId,
      table.createdAt,
    ),

    cashierIdx: index('payments_cashier_idx').on(table.cashierStaffId),

    clientIdx: index('payments_client_idx').on(table.clientId),

    bookingIdx: index('payments_booking_idx').on(table.bookingId),

    statusIdx: index('payments_status_idx').on(table.status),
  }),
);
