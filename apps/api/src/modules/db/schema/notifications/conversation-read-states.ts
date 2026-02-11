import {
  pgTable,
  uuid,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { conversations } from './conversations';
import { users } from '../users';
import { clients } from '../clients';

export const conversationReadStates = pgTable(
  'conversation_read_states',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),

    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),

    clientId: uuid('client_id').references(() => clients.id, {
      onDelete: 'cascade',
    }),

    lastReadAt: timestamp('last_read_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqConversationUser: uniqueIndex('crs_uniq_conversation_user').on(
      t.conversationId,
      t.userId,
    ),

    uniqConversationClient: uniqueIndex('crs_uniq_conversation_client').on(
      t.conversationId,
      t.clientId,
    ),

    byUser: index('crs_by_user').on(t.userId),
    byClient: index('crs_by_client').on(t.clientId),
  }),
);
