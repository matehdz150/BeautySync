import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

declare module 'express' {
  interface Request {
    requestId?: string;
    user?: AuthenticatedUser;
    publicUser?: {
      publicUserId: string;
      email: string | null;
      name: string | null;
      avatarUrl: string | null;
    };
    cookies: Record<string, string | undefined>;
  }
}
