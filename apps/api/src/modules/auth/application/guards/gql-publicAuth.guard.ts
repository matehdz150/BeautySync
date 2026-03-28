import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { GqlExecutionContext } from '@nestjs/graphql';
import { GetUserBySessionUseCase } from '../../core/use-cases/public/get-user-by-session.use-case';
import { GraphQLContext } from 'src/types/graphql-context';

@Injectable()
export class GqlPublicAuthGuard implements CanActivate {
  constructor(private readonly getUserBySession: GetUserBySessionUseCase) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context);

    const { req } = gqlCtx.getContext<GraphQLContext>();

    const cookieName = process.env.PUBLIC_SESSION_COOKIE_NAME ?? 'pubsid';

    const sessionId = req.cookies?.[cookieName];

    if (!sessionId) return true;

    const user = await this.getUserBySession.execute(sessionId);

    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }

    req.publicUser = {
      publicUserId: user.id,
    };

    return true;
  }
}
