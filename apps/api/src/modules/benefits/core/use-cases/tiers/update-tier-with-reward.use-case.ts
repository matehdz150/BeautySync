import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import {
  BENEFIT_PROGRAM_REPOSITORY,
  BENEFIT_TIERS_REPOSITORY,
  TIER_REWARDS_REPOSITORY,
  TIER_REWARD_CONFIG_VALIDATORS,
} from '../../ports/tokens';

import { Queue } from 'bullmq';

import { BenefitProgramRepository } from '../../ports/benefit-program.repository';
import { BenefitTiersRepository } from '../../ports/benefit-tier.repository';
import { TierRewardsRepository } from '../../ports/tier-reward.repository';
import { TierRewardConfigValidator } from '../../validators/tiers/tier-reward-config.validator.interface';

import { DB } from 'src/modules/db/client';
import { TierReward } from '../../entities/tier-reward.entity';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';
import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';
import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

type TierRewardType = 'gift_card' | 'coupon_percentage' | 'coupon_fixed';

function isTierRewardType(value: unknown): value is TierRewardType {
  return (
    value === 'gift_card' ||
    value === 'coupon_percentage' ||
    value === 'coupon_fixed'
  );
}

@Injectable()
export class UpdateTierWithRewardsUseCase {
  constructor(
    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepo: BenefitProgramRepository,

    @Inject(BENEFIT_TIERS_REPOSITORY)
    private readonly tiersRepo: BenefitTiersRepository,

    @Inject(TIER_REWARDS_REPOSITORY)
    private readonly rewardsRepo: TierRewardsRepository,

    @Inject(TIER_REWARD_CONFIG_VALIDATORS)
    private readonly validators: TierRewardConfigValidator[],

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,

    @Inject('DB')
    private readonly db: DB,

    @Inject('TIERS_QUEUE')
    private readonly queue: Queue,
  ) {}

  async execute(input: {
    tierId: string;
    branchId: string;

    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    minPoints?: number;

    user: AuthenticatedUser;

    rewards?: {
      type: 'ONE_TIME' | 'RECURRING';
      config: any;
    }[];
  }) {
    const branch = await this.branchesRepo.findById(input.branchId);

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!input.user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('No tienes acceso a esta sucursal');
    }
    const program = await this.programRepo.findByBranchId(input.branchId);

    if (!program || !program.isActive) {
      throw new BadRequestException('No active benefit program');
    }

    const tier = await this.tiersRepo.findById(input.tierId);

    if (!tier) {
      throw new NotFoundException('Tier not found');
    }

    if (tier.programId !== program.id) {
      throw new BadRequestException('Tier does not belong to branch');
    }

    // 🔥 detectar cambio relevante
    const minPointsChanged =
      input.minPoints !== undefined && input.minPoints !== tier.minPoints;

    const result = await this.db.transaction(async (tx) => {
      // =========================
      // UPDATE TIER
      // =========================
      const updatedTier = await this.tiersRepo.update(
        input.tierId,
        {
          name: input.name,
          description: input.description,
          color: input.color,
          icon: input.icon,
          minPoints: input.minPoints,
        },
        tx,
      );

      // =========================
      // REPLACE REWARDS
      // =========================
      if (input.rewards) {
        await this.rewardsRepo.deleteByTier(input.tierId, tx);

        const createdRewards: TierReward[] = [];

        for (const r of input.rewards) {
          const configObj = r.config as Record<string, unknown>;
          const rawType = configObj.type;

          if (!isTierRewardType(rawType)) {
            throw new BadRequestException(
              `Invalid reward type: ${String(rawType)}`,
            );
          }

          const validator = this.validators.find((v) => v.supports(rawType));

          if (!validator) {
            throw new BadRequestException(
              `Unsupported reward type: ${rawType}`,
            );
          }

          const validatedConfig = validator.validate(r.config);

          const reward = await this.rewardsRepo.create(
            {
              tierId: input.tierId,
              type: r.type,
              config: validatedConfig,
            },
            tx,
          );

          createdRewards.push(reward);
        }

        return {
          tier: updatedTier,
          rewards: createdRewards,
        };
      }

      return { tier: updatedTier };
    });

    // =========================
    // 🔥 RECALCULAR (FUERA DE TX)
    // =========================
    if (minPointsChanged) {
      await this.queue.add(
        'tiers.recalculate',
        {
          branchId: input.branchId,
        },
        {
          removeOnComplete: true,
          jobId: `tiers-recalculate-${input.branchId}-${Date.now()}`,
        },
      );
    }

    return result;
  }
}
