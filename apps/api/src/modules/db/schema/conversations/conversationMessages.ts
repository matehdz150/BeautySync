import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  check,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { conversations } from './conversations';
import { users } from '../users';
import { clients } from '../clients';

export const messageTypeEnum = pgEnum('conversation_message_type', [
  'TEXT',
  'SYSTEM',
  'BOOKING_EVENT',
]);

export const conversationMessages = pgTable(
  'conversation_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),

    // actor real
    senderUserId: uuid('sender_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    senderClientId: uuid('sender_client_id').references(() => clients.id, {
      onDelete: 'set null',
    }),

    // 🔥 tipo real del mensaje
    type: messageTypeEnum('type').notNull().default('TEXT'),

    // contenido
    body: text('body'),

    // payload estructurado (para eventos)
    metadata: text('metadata'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    byConversation: index('cm_by_conversation').on(t.conversationId),

    // scroll infinito eficiente
    byConversationCreated: index('cm_by_conversation_created').on(
      t.conversationId,
      t.createdAt,
    ),

    senderCheck: check(
      'cm_sender_check',
      sql`(
        (sender_user_id IS NOT NULL AND sender_client_id IS NULL)
        OR (sender_user_id IS NULL AND sender_client_id IS NOT NULL)
        OR type = 'SYSTEM'
      )`,
    ),
  }),
);
