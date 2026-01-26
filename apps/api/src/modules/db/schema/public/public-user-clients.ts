import { pgTable, uuid, timestamp, index } from 'drizzle-orm/pg-core';
import { publicUsers } from './public-users';
import { clients } from '../clients';

export const publicUserClients = pgTable(
  'public_user_clients',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    publicUserId: uuid('public_user_id')
      .notNull()
      .references(() => publicUsers.id, { onDelete: 'cascade' }),

    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    publicUserIdx: index('public_user_clients_public_user_idx').on(
      table.publicUserId,
    ),
    clientIdx: index('public_user_clients_client_idx').on(table.clientId),
  }),
);
