/* eslint-disable prettier/prettier */
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

import { branches } from '../branches/branches';
import { clients } from '../clients';
import { staff } from '../staff/staff';
import { services } from '../services';
import { publicUsers } from '../public/public-users';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'COMPLETED';

export const appointments = pgTable(
  'appointments',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),

    clientId: uuid('client_id').references(() => clients.id, {
      onDelete: 'cascade',
    }),

    staffId: uuid('staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'restrict' }),

    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'restrict' }),

    start: timestamp('start', { withTimezone: true }).notNull(),
    end: timestamp('end', { withTimezone: true }).notNull(),

    status: text('status')
      .$type<AppointmentStatus>()
      .notNull()
      .default('PENDING'),

    paymentStatus: text('payment_status')
      .$type<'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED'>()
      .notNull()
      .default('UNPAID'),

    publicBookingId: uuid('public_booking_id'),

    publicUserId: uuid('public_user_id').references(() => publicUsers.id, {
      onDelete: 'set null',
    }),

    priceCents: integer('price_cents'),

    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },

  (table) => ({
    // 🔥 más usado: calendario por staff
    staffStartIdx: index('appointment_staff_start_idx').on(
      table.staffId,
      table.start,
    ),

    // 🔥 calendario sucursal
    branchStartIdx: index('appointment_branch_start_idx').on(
      table.branchId,
      table.start,
    ),

    // 🔍 historial cliente
    clientIdx: index('appointment_client_idx').on(table.clientId),

    // ⚡ filtros por estado
    statusIdx: index('appointment_status_idx').on(table.status),

    publicBookingIdx: index('appointment_public_booking_idx').on(
      table.publicBookingId,
    ),
    publicUserIdx: index("appointment_public_user_idx").on(table.publicUserId),
  }),
);
