import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import type { Request } from 'express';
import { eq } from 'drizzle-orm';
import type * as client from 'src/modules/db/client';
import { branches } from 'src/modules/db/schema';

@Injectable()
export class BranchOwnerGuard implements CanActivate {
  constructor(@Inject('DB') private readonly db: client.DB) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const branchId =
      req.params?.branchId ?? req.params?.id ?? req.params?.branch_id;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = (req as any).user as { orgId?: string } | undefined;

    if (!user) {
      throw new UnauthorizedException(
        'Missing user (JwtAuthGuard not applied?)',
      );
    }

    if (!user.orgId) {
      throw new ForbiddenException('Missing orgId in JWT payload');
    }

    if (!branchId) {
      throw new ForbiddenException('Missing branch id param');
    }

    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
      columns: { id: true, organizationId: true },
    });

    if (!branch) {
      throw new ForbiddenException('Branch not found');
    }

    if (branch.organizationId !== user.orgId) {
      throw new ForbiddenException('You cannot access this branch');
    }

    return true;
  }
}
