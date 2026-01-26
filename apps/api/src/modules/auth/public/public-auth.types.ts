import type { publicUsers } from 'src/modules/db/schema';

export type PublicUser = typeof publicUsers.$inferSelect;

export type PublicRequest = Request & {
  publicUser?: PublicUser | null;
  publicSessionId?: string | null;
};
