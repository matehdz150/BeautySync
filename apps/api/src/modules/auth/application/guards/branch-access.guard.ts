import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Request } from 'express';

import { AuthenticatedUser } from '../../core/entities/authenticatedUser.entity';

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class BranchAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Missing user');
    }

    const branchId =
      req.params?.branchId ?? req.params?.branch_id ?? req.params?.id;

    if (!branchId) {
      throw new ForbiddenException('Missing branchId param');
    }

    if (!user.hasBranchAccess(branchId)) {
      throw new ForbiddenException('Forbidden branch access');
    }

    return true;
  }
}
