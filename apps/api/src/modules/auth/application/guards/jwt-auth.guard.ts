import { AuthGuard } from '@nestjs/passport';
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthenticatedUser } from '../../core/entities/authenticatedUser.entity';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = AuthenticatedUser>(err: unknown, user: unknown): TUser {
    if (err || !user) {
      throw err instanceof Error ? err : new UnauthorizedException();
    }

    return user as TUser;
  }
}
