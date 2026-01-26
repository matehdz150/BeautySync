import { relations } from 'drizzle-orm';
import { publicUsers } from './public-users';
import { publicUserClients } from './public-user-clients';
import { publicSessions } from './public-sessions';
import { appointments } from '../appointments/appointments';

export const publicUsersRelations = relations(publicUsers, ({ many }) => ({
  sessions: many(publicSessions),
  clients: many(publicUserClients),
  appointments: many(appointments),
}));
