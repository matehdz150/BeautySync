import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  BENEFIT_PROGRAM_REPOSITORY,
  BENEFIT_REWARD_REPOSITORY,
} from '../ports/tokens';

import { BenefitProgramRepository } from '../ports/benefit-program.repository';
import { BenefitRewardRepository } from '../ports/benefit-reward.repository';

import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

// 👇 reutiliza tus helpers existentes
function isGiftCardConfig(config: unknown): config is { amountCents: number } {
  if (typeof config !== 'object' || config === null) return false;
  const c = config as Record<string, unknown>;
  return typeof c.amountCents === 'number' && c.amountCents > 0;
}

function isCouponConfig(config: unknown): config is {
  type: 'percentage' | 'fixed';
  value: number;
  expiresAt?: string;
} {
  if (typeof config !== 'object' || config === null) return false;

  const c = config as Record<string, unknown>;

  if (!c.type || (c.type !== 'percentage' && c.type !== 'fixed')) {
    return false;
  }

  if (typeof c.value !== 'number' || c.value <= 0) {
    return false;
  }

  return true;
}

@Injectable()
export class UpdateBenefitRewardUseCase {
  constructor(
    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepo: BenefitProgramRepository,

    @Inject(BENEFIT_REWARD_REPOSITORY)
    private readonly rewardRepo: BenefitRewardRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
  ) {}

  async execute(input: {
    rewardId: string;
    branchId: string;

    type?: string;
    name?: string;
    pointsCost?: number;
    referenceId?: string | null;
    stock?: number | null;
    config?: unknown;
    isActive?: boolean;

    user: AuthenticatedUser;
  }) {
    // =========================
    // 1. REWARD
    // =========================
    const reward = await this.rewardRepo.findById(input.rewardId);

    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    // =========================
    // 2. BRANCH + ACCESS
    // =========================
    const branch = await this.branchesRepo.findById(input.branchId);

    if (!branch) {
      throw new BadRequestException('Sucursal inválida');
    }

    if (!input.user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('Sin acceso');
    }

    // =========================
    // 3. PROGRAM
    // =========================
    const program = await this.programRepo.findByBranchId(input.branchId);

    if (!program || !program.isActive) {
      throw new BadRequestException('No active benefit program');
    }

    // =========================
    // 4. BASE VALIDATIONS
    // =========================
    if (input.name !== undefined && input.name.trim().length === 0) {
      throw new BadRequestException('Nombre inválido');
    }

    if (input.pointsCost !== undefined && input.pointsCost <= 0) {
      throw new BadRequestException('pointsCost inválido');
    }

    if (input.stock !== undefined && input.stock !== null && input.stock < 0) {
      throw new BadRequestException('Stock inválido');
    }

    const finalType = input.type ?? reward.type;

    // =========================
    // 5. CONFIG VALIDATION 🔥
    // =========================
    let safeConfig = reward.config ?? {};

    if (input.config !== undefined) {
      switch (finalType) {
        case 'GIFT_CARD':
          if (!isGiftCardConfig(input.config)) {
            throw new BadRequestException('Config inválido para gift card');
          }
          safeConfig = {
            amountCents: input.config.amountCents,
          };
          break;

        case 'COUPON':
          if (!isCouponConfig(input.config)) {
            throw new BadRequestException('Config inválido para coupon');
          }
          safeConfig = {
            type: input.config.type,
            value: input.config.value,
            expiresAt: input.config.expiresAt,
          };
          break;

        case 'SERVICE':
        case 'PRODUCT':
          if (!input.referenceId && !reward.referenceId) {
            throw new BadRequestException(
              `referenceId requerido para tipo ${finalType}`,
            );
          }
          safeConfig = {};
          break;

        case 'CUSTOM':
          safeConfig = {};
          break;

        default:
          throw new BadRequestException('Tipo inválido');
      }
    }

    // =========================
    // 6. UPDATE
    // =========================
    return this.rewardRepo.update(input.rewardId, {
      type: finalType,
      name: input.name,
      pointsCost: input.pointsCost,
      referenceId: input.referenceId,
      stock: input.stock,
      config: safeConfig,
      isActive: input.isActive,
    });
  }
}
