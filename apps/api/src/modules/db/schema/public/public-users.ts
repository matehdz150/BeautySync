import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';

export const publicUsers = pgTable(
  'public_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Google login
    email: text('email'),
    googleSub: text('google_sub'),
    name: text('name'),
    avatarUrl: text('avatar_url'),

    // FUTURO: phone login
    phoneE164: text('phone_e164'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  },
  (table) => ({
    // búsquedas rápidas
    emailIdx: index('public_user_email_idx').on(table.email),
    googleSubIdx: index('public_user_google_sub_idx').on(table.googleSub),
    phoneIdx: index('public_user_phone_idx').on(table.phoneE164),
  }),
);
