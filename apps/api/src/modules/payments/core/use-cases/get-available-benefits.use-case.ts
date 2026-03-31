// modules/payments/core/use-cases/get-available-benefits.use-case.ts

import {
  Inject,
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { PAYMENTS_REPOSITORY } from '../ports/tokens';
import { PaymentsRepositoryPort } from '../ports/payment.repository';

import { PUBLIC_USERS_REPOSITORY } from 'src/modules/auth/core/ports/tokens';
import { PublicUsersRepositoryPort } from 'src/modules/auth/core/ports/public-users.repository.port';

import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';
import { BranchesRepositoryPort } from 'src/modules/auth/core/ports/branches.repository';

@Injectable()
export class GetAvailablePaymentBenefitsUseCase {
  constructor(
    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepo: PaymentsRepositoryPort,

    @Inject(PUBLIC_USERS_REPOSITORY)
    private readonly publicUsersRepo: PublicUsersRepositoryPort,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepositoryPort,
  ) {}

  async execute(input: { branchId: string; publicUserId?: string }) {
    const { branchId, publicUserId } = input;

    // =========================
    // 👻 GUEST MODE
    // =========================
    if (!publicUserId) {
      return {
        giftCards: [],
        coupons: [],
        isAuthenticated: false,
      };
    }

    // =========================
    // 🔒 VALIDATIONS
    // =========================
    if (!branchId) {
      throw new BadRequestException('branchId is required');
    }

    if (!publicUserId) {
      throw new ForbiddenException('Public user not authenticated');
    }

    // =========================
    // 👤 VALIDATE USER
    // =========================
    const publicUser = await this.publicUsersRepo.findById(publicUserId);

    if (!publicUser) {
      throw new ForbiddenException('Public user not found');
    }

    // =========================
    // 🏢 VALIDATE BRANCH
    // =========================
    const branch = await this.branchesRepo.findById(branchId);

    if (!branch) {
      throw new BadRequestException('Branch not found');
    }

    // =========================
    // 🎯 DOMAIN ACTION
    // =========================
    return this.paymentsRepo.getAvailableBenefits({
      branchId,
      publicUserId,
    });
  }
}
