import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PublicAuthService } from './public-auth.service';

@Injectable()
export class PublicAuthGuard implements CanActivate {
  constructor(private readonly auth: PublicAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const cookieName = process.env.PUBLIC_SESSION_COOKIE_NAME ?? 'pubsid';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const sessionId = (req.cookies?.[cookieName] as string | undefined) ?? '';

    if (!sessionId) {
      throw new UnauthorizedException('Missing session');
    }

    const user = await this.auth.getUserBySession(sessionId);

    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }

    // 🔥 GUARDA ESTO (no el user completo)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (req as any).publicUser = {
      publicUserId: user.id,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (req as any).publicSessionId = sessionId;

    return true;
  }
}