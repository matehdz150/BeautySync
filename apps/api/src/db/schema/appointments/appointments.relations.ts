import { relations } from 'drizzle-orm';
import { appointments } from './appointments';
import { clients } from '../clients';
import { publicUsers } from '../public/public-users';

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  client: one(clients, {
    fields: [appointments.clientId],
    references: [clients.id],
  }),

  publicUser: one(publicUsers, {
    fields: [appointments.publicUserId],
    references: [publicUsers.id],
  }),
}));
