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

    private readonly db: DB,
  ) {}

  async execute(input: CreateTierWithRewardsInput) {
    const program = await this.programRepo.findByBranchId(input.branchId);

    if (!program || !program.isActive) {
      throw new BadRequestException('No active benefit program');
    }

    return this.db.transaction(async () => {
      // =========================
      // 1. VALIDACIONES
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

      // =========================
      // 2. CREAR TIER
      // =========================
      const tier = await this.tiersRepo.create({
        programId: program.id,
        name: input.name,
        description: input.description ?? null,
        color: input.color ?? null,
        icon: input.icon ?? null,
        minPoints: input.minPoints,
        position,
      });

      // =========================
      // 3. CREAR REWARDS
      // =========================
      const createdRewards: TierReward[] = [];

      for (const r of input.rewards ?? []) {
        // 🔥 SAFE ACCESS
        if (typeof r.config !== 'object' || r.config === null) {
          throw new BadRequestException('Invalid reward config');
        }

        const configObj = r.config as Record<string, unknown>;

        const rawType = configObj.type;

        if (!isTierRewardType(rawType)) {
          throw new BadRequestException('Invalid reward type');
        }

        const type = rawType; // 🔥 ya tipado correctamente

        if (typeof type !== 'string') {
          throw new BadRequestException('Reward config missing type');
        }

        const validator = this.validators.find((v) => v.supports(type));

        if (!validator) {
          throw new BadRequestException(`Unsupported reward type: ${type}`);
        }

        const validatedConfig = validator.validate(r.config);

        const reward = await this.rewardsRepo.create({
          tierId: tier.id,
          type: r.type,
          config: validatedConfig,
        });

        createdRewards.push(reward);
      }

      return {
        tier,
        rewards: createdRewards,
      };
    });
  }
}
