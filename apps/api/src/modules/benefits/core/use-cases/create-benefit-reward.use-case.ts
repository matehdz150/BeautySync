import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  BENEFIT_PROGRAM_REPOSITORY,
  BENEFIT_REWARD_REPOSITORY,
} from '../ports/tokens';

import { BenefitProgramRepository } from '../ports/benefit-program.repository';
import { BenefitRewardRepository } from '../ports/benefit-reward.repository';

import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';
import { PaymentBenefitsRefreshService } from 'src/modules/payments/application/payment-benefits-refresh.service';

import { CreateBenefitRewardInput } from '../ports/benefit-reward.repository';

type GiftCardConfig = {
  amountCents: number;
};

type CouponConfig = {
  type: 'percentage' | 'fixed';
  value: number;
  expiresAt?: string;
};

function isGiftCardConfig(config: unknown): config is GiftCardConfig {
  if (typeof config !== 'object' || config === null) return false;

  const c = config as Record<string, unknown>;

  return typeof c.amountCents === 'number' && c.amountCents > 0;
}

function isCouponConfig(config: unknown): config is CouponConfig {
  if (typeof config !== 'object' || config === null) return false;

  const c = config as Record<string, unknown>;

  if (!c.type || (c.type !== 'percentage' && c.type !== 'fixed')) {
    return false;
  }

  if (typeof c.value !== 'number' || c.value <= 0) {
    return false;
  }

  if (c.expiresAt !== undefined) {
    if (typeof c.expiresAt !== 'string') return false;

    const date = new Date(c.expiresAt);
    if (isNaN(date.getTime())) return false;
  }

  return true;
}

@Injectable()
export class CreateBenefitRewardUseCase {
  constructor(
    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepo: BenefitProgramRepository,

    @Inject(BENEFIT_REWARD_REPOSITORY)
    private readonly rewardRepo: BenefitRewardRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
    private readonly paymentBenefitsRefresh: PaymentBenefitsRefreshService,
  ) {}

  async execute(input: CreateBenefitRewardInput) {
    // =========================
    // 1. VALIDAR SUCURSAL
    // =========================
    const branch = await this.branchesRepo.findById(input.branchId);

    if (!branch) {
      throw new BadRequestException('Sucursal inválida');
    }

    if (!input.user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('Sin acceso');
    }

    // =========================
    // 2. PROGRAMA ACTIVO
    // =========================
    const program = await this.programRepo.findByBranchId(input.branchId);

    if (!program || !program.isActive) {
      throw new BadRequestException('No active benefit program');
    }

    // =========================
    // 3. VALIDACIONES BASE
    // =========================

    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestException('Nombre requerido');
    }

    if (!input.pointsCost || input.pointsCost <= 0) {
      throw new BadRequestException('pointsCost debe ser mayor a 0');
    }

    if (input.stock !== undefined && input.stock !== null) {
      if (input.stock < 0) {
        throw new BadRequestException('Stock inválido');
      }
    }

    // =========================
    // 4. VALIDACIONES POR TIPO 🔥
    // =========================

    switch (input.type) {
      case 'SERVICE':
      case 'PRODUCT':
        if (!input.referenceId) {
          throw new BadRequestException(
            `referenceId requerido para tipo ${input.type}`,
          );
        }
        break;

      case 'GIFT_CARD': {
        if (!input.config || !isGiftCardConfig(input.config)) {
          throw new BadRequestException('amountCents inválido para gift card');
        }
        break;
      }

      case 'COUPON': {
        if (!input.config || !isCouponConfig(input.config)) {
          throw new BadRequestException('Config inválido para coupon');
        }
        break;
      }

      case 'CUSTOM':
        // libre, pero puedes validar si quieres
        break;

      default:
        throw new BadRequestException('Tipo inválido');
    }

    let safeConfig: Record<string, unknown> = {};

    if (input.type === 'GIFT_CARD' && isGiftCardConfig(input.config)) {
      safeConfig = { amountCents: input.config.amountCents };
    }

    if (input.type === 'COUPON' && isCouponConfig(input.config)) {
      safeConfig = {
        type: input.config.type,
        value: input.config.value,
        expiresAt: input.config.expiresAt,
      };
    }

    // =========================
    // 5. CREAR REWARD
    // =========================
    const reward = await this.rewardRepo.create({
      programId: program.id,
      type: input.type,
      name: input.name.trim(),
      pointsCost: input.pointsCost,
      referenceId: input.referenceId ?? null,
      stock: input.stock ?? null,
      config: safeConfig,
      isActive: true,
    });
    await this.paymentBenefitsRefresh.invalidateBranch(input.branchId);
    return reward;
  }
}
