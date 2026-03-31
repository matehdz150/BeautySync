// core/use-cases/get-coupons-by-branch.use-case.ts

import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { COUPON_REPOSITORY } from '../ports/tokens';
import { CouponRepository } from '../ports/coupon.repository';

import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

@Injectable()
export class GetCouponsByBranchUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly repo: CouponRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
  ) {}

  async execute(input: {
    branchId: string;
    user: AuthenticatedUser;
    onlyActive?: boolean; // 🔥 opcional pro
  }) {
    // =========================
    // VALIDATE BRANCH
    // =========================
    const branch = await this.branchesRepo.findById(input.branchId);

    if (!branch) {
      throw new NotFoundException('Sucursal no encontrada');
    }

    // =========================
    // ACCESS CONTROL
    // =========================
    if (!input.user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('No tienes acceso a esta sucursal');
    }

    // =========================
    // FETCH
    // =========================
    const coupons = await this.repo.findByBranch(input.branchId);

    // =========================
    // FILTER (opcional)
    // =========================
    if (input.onlyActive) {
      return coupons.filter((c) => c.isActive);
    }

    return coupons;
  }
}
