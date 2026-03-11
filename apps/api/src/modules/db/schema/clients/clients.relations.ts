import { relations } from 'drizzle-orm';
import { clients } from './clients';
import { publicUserClients } from '../public';
import { appointments } from '../appointments';
import { clientProfiles } from './clientProfiles';

export const clientsRelations = relations(clients, ({ many, one }) => ({
  publicUsers: many(publicUserClients),
  appointments: many(appointments),
  profile: one(clientProfiles, {
    fields: [clients.id],
    references: [clientProfiles.clientId],
  }),
}));
