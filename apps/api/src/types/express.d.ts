import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
    publicUser?: {
      publicUserId: string;
    };
    publicSessionId?: string;
    cookies: Record<string, string | undefined>;
  }
}
