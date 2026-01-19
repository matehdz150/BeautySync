import { relations } from 'drizzle-orm';
import { publicUserClients } from './public-user-clients';
import { publicUsers } from './public-users';
import { clients } from '../clients';

export const publicUserClientsRelations = relations(
  publicUserClients,
  ({ one }) => ({
    publicUser: one(publicUsers, {
      fields: [publicUserClients.publicUserId],
      references: [publicUsers.id],
    }),

    client: one(clients, {
      fields: [publicUserClients.clientId],
      references: [clients.id],
    }),
  }),
);
