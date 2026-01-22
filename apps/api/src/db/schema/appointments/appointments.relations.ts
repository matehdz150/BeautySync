import { relations } from 'drizzle-orm';
import { appointments } from './appointments';
import { clients } from '../clients';
import { publicUsers } from '../public/public-users';
import { services } from '../services';
import { staff } from '../staff';

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  client: one(clients, {
    fields: [appointments.clientId],
    references: [clients.id],
  }),

  publicUser: one(publicUsers, {
    fields: [appointments.publicUserId],
    references: [publicUsers.id],
  }),

  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
  staff: one(staff, {
    fields: [appointments.staffId],
    references: [staff.id],
  }),
}));
