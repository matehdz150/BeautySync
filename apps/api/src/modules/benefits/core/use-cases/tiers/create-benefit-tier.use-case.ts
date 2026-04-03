import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import {
  BENEFIT_TIERS_REPOSITORY,
  BENEFIT_PROGRAM_REPOSITORY,
  TIER_REWARDS_REPOSITORY,
  TIER_REWARD_CONFIG_VALIDATORS,
} from '../../ports/tokens';

import { BenefitProgramRepository } from '../../ports/benefit-program.repository';
import {
  BenefitTiersRepository,
  CreateTierWithRewardsInput,
} from '../../ports/benefit-tier.repository';
import { TierRewardsRepository } from '../../ports/tier-reward.repository';
import { TierRewardConfigValidator } from '../../validators/tiers/tier-reward-config.validator.interface';

import { DB } from 'src/modules/db/client';
import { TierReward } from '../../entities/tier-reward.entity';

type TierRewardType = 'gift_card' | 'coupon_percentage' | 'coupon_fixed';

function isTierRewardType(value: unknown): value is TierRewardType {
  return (
    value === 'gift_card' ||
    value === 'coupon_percentage' ||
    value === 'coupon_fixed'
  );
}

@Injectable()
export class CreateTierWithRewardsUseCase {
  constructor(
    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepo: BenefitProgramRepository,

    @Inject(BENEFIT_TIERS_REPOSITORY)
    private readonly tiersRepo: BenefitTiersRepository,

    @Inject(TIER_REWARDS_REPOSITORY)
    private readonly rewardsRepo: TierRewardsRepository,

    @Inject(TIER_REWARD_CONFIG_VALIDATORS)
    private readonly validators: TierRewardConfigValidator[],

    @Inject('DB')
    private readonly db: DB,
  ) {}

  async execute(input: CreateTierWithRewardsInput) {
    const program = await this.programRepo.findByBranchId(input.branchId);

    if (!program || !program.isActive) {
      throw new BadRequestException('No active benefit program');
    }

    // =========================
    // 1. VALIDACIONES FUERA DE TX
    // =========================
    const tiers = await this.tiersRepo.getByProgram(program.id);

    if (tiers.length >= 5) {
      throw new BadRequestException('Max 5 tiers allowed');
    }

    const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);

    if (sorted.some((t) => t.minPoints === input.minPoints)) {
      throw new BadRequestException('minPoints must be unique');
    }

    if (
      sorted.length > 0 &&
      input.minPoints <= sorted[sorted.length - 1].minPoints
    ) {
      throw new BadRequestException(
        'minPoints must be greater than previous tier',
      );
    }

    const position = tiers.length + 1;

    try {
      return await this.db.transaction(async (tx) => {
        console.log('🔐 TX START');

        // =========================
        // 2. CREAR TIER
        // =========================

        const tier = await this.tiersRepo.create(
          {
            programId: program.id,
            name: input.name,
            description: input.description ?? null,
            color: input.color ?? null,
            icon: input.icon ?? null,
            minPoints: input.minPoints,
            position,
          },
          tx,
        );

        // =========================
        // 3. CREAR REWARDS
        // =========================
        const createdRewards: TierReward[] = [];

        for (const r of input.rewards ?? []) {
          if (typeof r.config !== 'object' || r.config === null) {
            throw new BadRequestException('Invalid reward config');
          }

          const configObj = r.config as Record<string, unknown>;
          const rawType = configObj.type;

          if (!isTierRewardType(rawType)) {
            throw new BadRequestException(`Invalid reward type}`);
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
              tierId: tier.id,
              type: r.type,
              config: validatedConfig,
            },
            tx,
          );

          createdRewards.push(reward);
        }

        return {
          tier,
          rewards: createdRewards,
        };
      });
    } catch (err) {
      console.error('❌ CreateTier ERROR', err);
      throw err;
    }
  }
}
