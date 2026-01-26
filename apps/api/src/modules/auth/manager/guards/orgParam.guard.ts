import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class OrgParamGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const orgIdParam = req.params?.orgId;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = (req as any).user as { orgId?: string } | undefined;

    if (!user) {
      throw new UnauthorizedException(
        'Missing user (JwtAuthGuard not applied?)',
      );
    }

    if (!orgIdParam) {
      throw new ForbiddenException('Missing orgId param');
    }

    if (!user.orgId) {
      throw new ForbiddenException('Missing orgId in JWT payload');
    }

    if (orgIdParam !== user.orgId) {
      throw new ForbiddenException('You cannot access this organization');
    }

    return true;
  }
}
