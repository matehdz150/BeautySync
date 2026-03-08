import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Request } from 'express';

@Injectable()
export class OrganizationAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Missing user');
    }

    const orgId =
      req.params?.orgId ??
      req.params?.organizationId ??
      req.params?.organization_id;

    if (!orgId) {
      throw new ForbiddenException('Missing organization param');
    }

    if (!user.orgId) {
      throw new ForbiddenException('User not linked to organization');
    }

    if (orgId !== user.orgId) {
      throw new ForbiddenException('Forbidden organization access');
    }

    return true;
  }
}
