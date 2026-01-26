import { relations } from 'drizzle-orm';
import { clients } from './clients';
import { publicUserClients } from '../public';
import { appointments } from '../appointments';

export const clientsRelations = relations(clients, ({ many }) => ({
  publicUsers: many(publicUserClients),
  appointments: many(appointments),
}));
