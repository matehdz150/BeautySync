import { Inject, Injectable } from '@nestjs/common';
import { BenefitRewardRepository } from '../../core/ports/benefit-reward.repository';
import { DB } from 'src/modules/db/client';
import { eq } from 'drizzle-orm';
import { benefitRewards } from 'src/modules/db/schema';
import { BenefitRewardType } from '../../core/engine/ types';

@Injectable()
export class DrizzleBenefitRewardRepository implements BenefitRewardRepository {
  constructor(@Inject('DB') private readonly db: DB) {}

  async findById(id: string) {
    const row = await this.db.query.benefitRewards.findFirst({
      where: eq(benefitRewards.id, id),
    });

    if (!row) return null;

    return {
      id: row.id,
      programId: row.programId,
      type: row.type as BenefitRewardType,
      referenceId: row.referenceId ?? undefined,
      pointsCost: row.pointsCost,
      isActive: row.isActive,
      config:
        row.config && typeof row.config === 'object'
          ? (row.config as Record<string, unknown>)
          : undefined,
    };
  }
}
