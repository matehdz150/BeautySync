import { Inject, Injectable } from '@nestjs/common';
import { DB } from '../../../db/client';
import { BenefitProgressRepository } from '../../core/ports/benefit-progress.repository';
import { and, eq, sql } from 'drizzle-orm';
import { benefitUserProgress } from '../../../db/schema';

@Injectable()
export class DrizzleBenefitProgressRepository implements BenefitProgressRepository {
  constructor(@Inject('DB') private readonly db: DB) {}

  async getProgress(input: { userId: string; ruleId: string }) {
    const row = await this.db.query.benefitUserProgress.findFirst({
      where: and(
        eq(benefitUserProgress.userId, input.userId),
        eq(benefitUserProgress.ruleId, input.ruleId),
      ),
    });

    return {
      progressValue: row?.progressValue ?? 0,
      lastTriggeredAt: row?.lastTriggeredAt ?? undefined,
    };
  }

  async incrementProgress(params: {
    userId: string;
    ruleId: string;
    value: number;
  }) {
    await this.db
      .insert(benefitUserProgress)
      .values({
        userId: params.userId,
        ruleId: params.ruleId,
        progressValue: params.value,
      })
      .onConflictDoUpdate({
        target: [benefitUserProgress.userId, benefitUserProgress.ruleId],
        set: {
          progressValue: sql`${benefitUserProgress.progressValue} + ${params.value}`,
          updatedAt: new Date(),
        },
      });
  }

  async resetProgress(params: { userId: string; ruleId: string }) {
    await this.db
      .update(benefitUserProgress)
      .set({
        progressValue: 0,
        lastTriggeredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(benefitUserProgress.userId, params.userId),
          eq(benefitUserProgress.ruleId, params.ruleId),
        ),
      );
  }
}
