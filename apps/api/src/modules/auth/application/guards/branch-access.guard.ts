import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Request } from 'express';

import { ValidateBranchAccessUseCase } from '../../core/use-cases/manager/validate-branch-access.use-case';

@Injectable()
export class BranchAccessGuard implements CanActivate {
  constructor(
    private readonly validateBranchAccess: ValidateBranchAccessUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Missing user');
    }

    const branchId =
      req.params?.branchId ?? req.params?.branch_id ?? req.params?.id;

    if (!branchId) {
      throw new ForbiddenException('Missing branchId param');
    }

    await this.validateBranchAccess.execute({
      branchId,
      userOrgId: user.orgId,
    });

    return true;
  }
}
