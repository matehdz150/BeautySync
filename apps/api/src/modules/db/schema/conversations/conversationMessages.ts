import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  boolean,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { conversations } from './conversations';
import { users } from '../users';
import { clients } from '../clients';

export const conversationMessages = pgTable(
  'conversation_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // 🔗 relación principal
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),

    // 👤 actor real
    senderUserId: uuid('sender_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    senderClientId: uuid('sender_client_id').references(() => clients.id, {
      onDelete: 'set null',
    }),

    // 💬 contenido
    body: text('body').notNull(),

    // útil para eventos automáticos (cancelaciones, confirmaciones, etc)
    isSystem: boolean('is_system').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    // ⚡ cargar conversación
    byConversation: index('cm_by_conversation').on(t.conversationId),

    // ⚡ paginación eficiente
    byConversationCreated: index('cm_by_conversation_created').on(
      t.conversationId,
      t.createdAt,
    ),

    // ⚠️ exactamente uno de los dos debe existir
    senderCheck: check(
      'cm_sender_check',

      sql`(sender_user_id IS NOT NULL AND sender_client_id IS NULL)
          OR (sender_user_id IS NULL AND sender_client_id IS NOT NULL)
          OR is_system = true`,
    ),
  }),
);
