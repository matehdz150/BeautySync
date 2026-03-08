import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';

import { GetUserBySessionUseCase } from '../../core/use-cases/public/get-user-by-session.use-case';

@Injectable()
export class PublicAuthGuard implements CanActivate {
  constructor(private readonly getUserBySession: GetUserBySessionUseCase) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const cookieName = process.env.PUBLIC_SESSION_COOKIE_NAME ?? 'pubsid';

    const sessionId = req.cookies?.[cookieName] ?? '';

    if (!sessionId) {
      throw new UnauthorizedException('Missing session');
    }

    const user = await this.getUserBySession.execute(sessionId);

    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }

    req.publicUser = {
      publicUserId: user.id,
    };

    req.publicSessionId = sessionId;

    return true;
  }
}
