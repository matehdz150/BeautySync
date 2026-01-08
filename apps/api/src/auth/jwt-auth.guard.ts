import { AuthGuard } from '@nestjs/passport';
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(ctx: ExecutionContext) {
    console.log('🛡 JwtAuthGuard hit');
    return super.canActivate(ctx);
  }

  handleRequest(err, user) {
    console.log('🧍 user = ', user);
    if (err || !user) throw err || new UnauthorizedException();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }
}
