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
  BENEFIT_TRANSACTION_MANAGER,
} from '../ports/tokens';
import {
  BenefitProgramRepository,
  RedeemBenefitRewardInput,
} from '../ports/benefit-program.repository';
import { BenefitRewardRepository } from '../ports/benefit-reward.repository';
import { BenefitBalanceRepository } from '../ports/benefit-balance.repository';
import { BenefitPointsRepository } from '../ports/benefit-points.repository';
import { BenefitRedemptionRepository } from '../ports/benefit-redemption.repository';
import { BenefitTransactionManager } from '../ports/benefit-transactiont-manager.repository';
import { BenefitRewardEngine } from '../engine/benefit-reward-engine.service';

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

    @Inject(BENEFIT_TRANSACTION_MANAGER)
    private readonly txManager: BenefitTransactionManager,

    private readonly rewardEngine: BenefitRewardEngine,
  ) {}

  async execute(input: RedeemBenefitRewardInput) {
    // =========================
    // 1. PROGRAMA
    // =========================
    const program = await this.programRepo.findByBranchId(input.branchId);

    if (!program || !program.isActive) {
      throw new BadRequestException('No active benefit program');
    }

    // =========================
    // 2. REWARD
    // =========================
    const reward = await this.rewardRepo.findById(input.rewardId);

    if (!reward) {
      throw new BadRequestException('Reward not found');
    }

    if (!reward.isActive) {
      throw new BadRequestException('Reward inactive');
    }

    if (reward.programId !== program.id) {
      throw new ForbiddenException('Invalid reward for branch');
    }

    // =========================
    // 3. TRANSACTION
    // =========================
    return this.txManager.runInTransaction(async () => {
      // 🔥 3.1 DECREMENTO ATÓMICO
      const success = await this.balanceRepo.decrementIfEnough({
        userId: input.user.id,
        branchId: input.branchId,
        points: reward.pointsCost,
      });

      if (!success) {
        throw new BadRequestException('Insufficient points');
      }

      // 🔥 3.2 LEDGER (idempotente)
      await this.pointsRepo.addPoints({
        userId: input.user.id,
        branchId: input.branchId,
        points: -reward.pointsCost,
        source: 'REWARD_REDEEM',
        idempotencyKey: input.idempotencyKey,
        referenceId: reward.id,
      });

      // 🔥 3.3 EJECUTAR REWARD
      await this.rewardEngine.redeem({
        userId: input.user.id,
        branchId: input.branchId,
        reward,
        context: {},
      });

      // 🔥 3.4 REDENCIÓN
      const redemption = await this.redemptionRepo.create({
        rewardId: reward.id,
        userId: input.user.id,
        branchId: input.branchId,
        pointsSpent: reward.pointsCost,
        status: 'CONFIRMED',
        referenceCode: this.generateReferenceCode(),
        metadata: {
          idempotencyKey: input.idempotencyKey,
        },
      });

      return redemption;
    });
  }

  private generateReferenceCode() {
    return `BEN-${Date.now()}`;
  }
}
