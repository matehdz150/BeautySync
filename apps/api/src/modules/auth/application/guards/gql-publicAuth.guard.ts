import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLContext } from 'src/types/graphql-context';
import { TokensService } from '../services/tokens.service';

@Injectable()
export class GqlPublicAuthGuard implements CanActivate {
  constructor(private readonly tokensService: TokensService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context);

    const { req } = gqlCtx.getContext<GraphQLContext>();

    const cookieName = process.env.PUBLIC_SESSION_COOKIE_NAME ?? 'pubsid';

    const sessionId = req.cookies?.[cookieName];

    if (!sessionId) return true;

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
      // Public GraphQL queries must degrade to guest mode if the cookie is stale.
      req.publicUser = undefined;
      return true;
    }
  }
}
