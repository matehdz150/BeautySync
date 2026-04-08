import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';
import { TokensService } from '../services/tokens.service';

@Injectable()
export class PublicAuthGuard implements CanActivate {
  constructor(private readonly tokensService: TokensService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

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
