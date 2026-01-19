import { relations } from 'drizzle-orm';
import { clients } from '../clients';
import { paymentItems } from './paymentItems';
import { payments } from './payment';
import { appointments } from '../appointments';
import { staff } from '../staff';

export const paymentsRelations = relations(payments, ({ many, one }) => ({
  items: many(paymentItems),

  client: one(clients, {
    fields: [payments.clientId],
    references: [clients.id],
  }),

  appointment: one(appointments, {
    fields: [payments.appointmentId],
    references: [appointments.id],
  }),

  cashier: one(staff, {
    fields: [payments.cashierStaffId],
    references: [staff.id],
  }),
}));

export const paymentItemsRelations = relations(paymentItems, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentItems.paymentId],
    references: [payments.id],
  }),

  staff: one(staff, {
    fields: [paymentItems.staffId],
    references: [staff.id],
  }),
}));
