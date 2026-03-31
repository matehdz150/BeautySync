// core/use-cases/create-coupon.use-case.ts

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';

import { COUPON_REPOSITORY } from '../ports/tokens';
import { CouponRepository } from '../ports/coupon.repository';

import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

@Injectable()
export class CreateCouponUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly repo: CouponRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
  ) {}

  async execute(input: {
    branchId: string;
    code: string;

    type: 'percentage' | 'fixed';
    value: number;

    minAmountCents?: number;
    maxDiscountCents?: number;

    usageLimit?: number;

    assignedToUserId?: string | null;

    expiresAt?: Date | null;

    serviceIds?: string[]; // 🔥 NUEVO

    user: AuthenticatedUser;
  }) {
    // =========================
    // VALIDATIONS
    // =========================
    if (!input.code) {
      throw new BadRequestException('Código requerido');
    }

    if (input.value <= 0) {
      throw new BadRequestException('Valor inválido');
    }

    if (input.type === 'percentage' && input.value > 100) {
      throw new BadRequestException('Máximo 100%');
    }

    // =========================
    // ACCESS
    // =========================
    const branch = await this.branchesRepo.findById(input.branchId);

    if (!branch) throw new BadRequestException('Sucursal inválida');

    if (!input.user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('Sin acceso');
    }

    // =========================
    // CREATE
    // =========================
    const coupon = await this.repo.create({
      ...input,
    });

    // 🔥 ASIGNAR SERVICIOS (OPCIONAL)
    if (input.serviceIds?.length) {
      await this.repo.assignServices(coupon.id, input.serviceIds);
    }

    return coupon;
  }
}
