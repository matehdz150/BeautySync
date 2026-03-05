import { relations } from 'drizzle-orm';

import { clients } from '../clients';
import { paymentItems } from './paymentItems';
import { payments } from './payment';
import { staff } from '../staff';
import { publicBookings } from '../public/public-bookings';

export const paymentsRelations = relations(payments, ({ many, one }) => ({
  /* =====================
     ITEMS DEL PAYMENT
  ===================== */

  items: many(paymentItems),

  /* =====================
     CLIENTE
  ===================== */

  client: one(clients, {
    fields: [payments.clientId],
    references: [clients.id],
  }),

  /* =====================
     BOOKING
  ===================== */

  booking: one(publicBookings, {
    fields: [payments.bookingId],
    references: [publicBookings.id],
  }),

  /* =====================
     CAJERO
  ===================== */

  cashier: one(staff, {
    fields: [payments.cashierStaffId],
    references: [staff.id],
  }),
}));

export const paymentItemsRelations = relations(paymentItems, ({ one }) => ({
  /* =====================
     PAYMENT
  ===================== */

  payment: one(payments, {
    fields: [paymentItems.paymentId],
    references: [payments.id],
  }),

  /* =====================
     STAFF ASOCIADO
  ===================== */

  staff: one(staff, {
    fields: [paymentItems.staffId],
    references: [staff.id],
  }),
}));
