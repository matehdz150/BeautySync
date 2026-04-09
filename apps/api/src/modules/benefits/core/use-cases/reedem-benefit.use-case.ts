import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  BENEFIT_PROGRAM_REPOSITORY,
  BENEFIT_REWARD_REPOSITORY,
  BENEFIT_BALANCE_REPOSITORY,
  BENEFIT_POINTS_REPOSITORY,
  BENEFIT_REDEMPTION_REPOSITORY,
} from '../ports/tokens';
import {
  BenefitProgramRepository,
  RedeemBenefitRewardInput,
} from '../ports/benefit-program.repository';
import { BenefitRewardRepository } from '../ports/benefit-reward.repository';
import { BenefitBalanceRepository } from '../ports/benefit-balance.repository';
import { BenefitPointsRepository } from '../ports/benefit-points.repository';
import { BenefitRedemptionRepository } from '../ports/benefit-redemption.repository';
import { BenefitRewardEngine } from '../engine/benefit-reward-engine.service';
import { randomUUID } from 'crypto';
import { PaymentBenefitsRefreshService } from 'src/modules/payments/application/payment-benefits-refresh.service';

@Injectable()
export class RedeemBenefitRewardUseCase {
  constructor(
    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepo: BenefitProgramRepository,

    @Inject(BENEFIT_REWARD_REPOSITORY)
    private readonly rewardRepo: BenefitRewardRepository,

    @Inject(BENEFIT_BALANCE_REPOSITORY)
    private readonly balanceRepo: BenefitBalanceRepository,

    @Inject(BENEFIT_POINTS_REPOSITORY)
    private readonly pointsRepo: BenefitPointsRepository,

    @Inject(BENEFIT_REDEMPTION_REPOSITORY)
    private readonly redemptionRepo: BenefitRedemptionRepository,

    private readonly rewardEngine: BenefitRewardEngine,
    private readonly paymentBenefitsRefresh: PaymentBenefitsRefreshService,
  ) {}

  private generateReferenceCode() {
    return `BEN-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private resolveIdempotencyKey(input: RedeemBenefitRewardInput) {
    const provided = input.idempotencyKey?.trim();

    if (provided) return provided;

    return `redeem:auto:${input.user.id}:${input.branchId}:${input.rewardId}:${randomUUID()}`;
  }

  async execute(input: RedeemBenefitRewardInput) {
    const idempotencyKey = this.resolveIdempotencyKey(input);

    const existingBeforeTx =
      await this.redemptionRepo.findByIdempotencyKey?.(idempotencyKey);

    if (existingBeforeTx) return existingBeforeTx;

    // =========================
    // PROGRAMA
    // =========================
    const program = await this.programRepo.findByBranchId(input.branchId);

    if (!program || !program.isActive) {
      throw new BadRequestException('No active benefit program');
    }

    // =========================
    // REWARD
    // =========================
    const reward = await this.rewardRepo.findById(input.rewardId);

    if (!reward) throw new BadRequestException('Reward not found');
    if (!reward.isActive) throw new BadRequestException('Reward inactive');

    if (reward.programId !== program.id) {
      throw new ForbiddenException('Invalid reward for branch');
    }

    if (!reward.config) {
      throw new BadRequestException('Invalid reward configuration');
    }

    // =========================
    // LEDGER
    // =========================
    const wasLedgerInserted = await this.pointsRepo.addPoints({
      userId: input.user.id,
      branchId: input.branchId,
      points: -reward.pointsCost,
      source: 'REWARD_REDEEM',
      idempotencyKey,
      referenceId: reward.id,
      updateBalanceCache: false,
    });

    if (!wasLedgerInserted) {
      const existingAfterLedgerConflict =
        await this.redemptionRepo.findByIdempotencyKey?.(idempotencyKey);

      if (existingAfterLedgerConflict) {
        return existingAfterLedgerConflict;
      }

      throw new BadRequestException('Duplicate idempotency key');
    }

    // =========================
    // BALANCE
    // =========================
    const success = await this.balanceRepo.decrementIfEnough({
      userId: input.user.id,
      branchId: input.branchId,
      points: reward.pointsCost,
    });

    if (!success) {
      throw new BadRequestException('Insufficient points');
    }

    // =========================
    // REDENCIÓN (PENDING)
    // =========================
    const redemption = await this.redemptionRepo.create({
      rewardId: reward.id,
      userId: input.user.id,
      branchId: input.branchId,
      pointsSpent: reward.pointsCost,
      status: 'PENDING',
      referenceCode: this.generateReferenceCode(),
      metadata: {
        idempotencyKey,
      },
    });

    // =========================
    // ENGINE
    // =========================
    try {
      await this.rewardEngine.redeem({
        userId: input.user.id,
        branchId: input.branchId,
        reward,
        context: {},
      });

      // 🔥 CONFIRMAR
      await this.redemptionRepo.updateStatus(redemption.id, 'CONFIRMED');
    } catch {
      // 🔥 OPCIONAL (muy pro)
      await this.redemptionRepo.updateStatus(redemption.id, 'FAILED');

      throw new BadRequestException('Reward execution failed');
    }

    await this.paymentBenefitsRefresh.enqueueUserRefresh({
      branchId: input.branchId,
      publicUserId: input.user.id,
    });

    return redemption;
  }
}
