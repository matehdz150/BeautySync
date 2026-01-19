import type { publicUsers } from 'src/db/schema';

export type PublicUser = typeof publicUsers.$inferSelect;

export type PublicRequest = Request & {
  publicUser?: PublicUser | null;
  publicSessionId?: string | null;
};
