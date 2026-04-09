import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';
import { TokensService } from '../services/tokens.service';

type PublicSessionUser = {
  publicUserId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

type PublicAuthRequest = Request & {
  publicUser?: PublicSessionUser;
};

@Injectable()
export class PublicAuthGuard implements CanActivate {
  constructor(private readonly tokensService: TokensService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<PublicAuthRequest>();

    const cookieName = process.env.PUBLIC_SESSION_COOKIE_NAME ?? 'pubsid';

    const sessionId = req.cookies?.[cookieName] ?? '';

    if (!sessionId) {
      throw new UnauthorizedException('Missing session');
    }

    try {
      const user = this.tokensService.verifyPublicToken(sessionId);
      req.publicUser = {
        publicUserId: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid session');
    }
  }
}
