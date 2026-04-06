import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DB } from '../../../db/client';
import { benefitEarnRules, benefitPrograms } from '../../../db/schema';

import { BenefitRuleRepository } from '../../core/ports/benefit-rule.repository';
import { BenefitEarnRuleEntity } from '../../core/entities/benefit-rule.entity';
import { createBenefitEarnRuleEntity } from './benefit-rule.factory';

@Injectable()
export class DrizzleBenefitRuleRepository implements BenefitRuleRepository {
  constructor(@Inject('DB') private readonly db: DB) {}

  // =========================
  // FIND ACTIVE RULES
  // =========================
  async findActiveByBranch(branchId: string): Promise<BenefitEarnRuleEntity[]> {
    const rows = await this.db
      .select({
        id: benefitEarnRules.id,
        programId: benefitEarnRules.programId,
        type: benefitEarnRules.type,
        isActive: benefitEarnRules.isActive,
        config: benefitEarnRules.config,
      })
      .from(benefitEarnRules)
      .innerJoin(
        benefitPrograms,
        eq(benefitPrograms.id, benefitEarnRules.programId),
      )
      .where(
        and(
          eq(benefitPrograms.branchId, branchId),
          eq(benefitPrograms.isActive, true),
          eq(benefitEarnRules.isActive, true),
        ),
      );

    return rows.map((row) =>
      createBenefitEarnRuleEntity({
        id: row.id,
        programId: row.programId,
        type: row.type,
        isActive: row.isActive,
        config: row.config as Record<string, unknown>,
      }),
    );
  }

  // =========================
  // CREATE RULE
  // =========================
  async create(data: {
    programId: string;
    type: BenefitEarnRuleEntity['type'];
    config: Record<string, unknown>;
    isActive: boolean;
  }): Promise<BenefitEarnRuleEntity> {
    const [row] = await this.db
      .insert(benefitEarnRules)
      .values({
        programId: data.programId,
        type: data.type,
        config: data.config,
        isActive: data.isActive,
      })
      .returning();

    return createBenefitEarnRuleEntity({
      id: row.id,
      programId: row.programId,
      type: row.type,
      isActive: row.isActive,
      config: row.config as Record<string, unknown>,
    });
  }

  async update(
    id: string,
    data: {
      type?: BenefitEarnRuleEntity['type'];
      config?: Record<string, unknown>;
      isActive?: boolean;
    },
  ): Promise<BenefitEarnRuleEntity> {
    const [row] = await this.db
      .update(benefitEarnRules)
      .set({
        ...(data.type && { type: data.type }),
        ...(data.config && { config: data.config }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      })
      .where(eq(benefitEarnRules.id, id))
      .returning();

    if (!row) {
      throw new Error('Rule not found after update');
    }

    return createBenefitEarnRuleEntity({
      id: row.id,
      programId: row.programId,
      type: row.type,
      isActive: row.isActive,
      config: row.config as Record<string, unknown>,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db
      .update(benefitEarnRules)
      .set({ isActive: false })
      .where(eq(benefitEarnRules.id, id));
  }

  // =========================
  // FIND BY ID
  // =========================
  async findById(id: string): Promise<BenefitEarnRuleEntity | null> {
    const row = await this.db.query.benefitEarnRules.findFirst({
      where: eq(benefitEarnRules.id, id),
    });

    if (!row) return null;

    return createBenefitEarnRuleEntity({
      id: row.id,
      programId: row.programId,
      type: row.type,
      isActive: row.isActive,
      config: row.config as Record<string, unknown>, // ok
    });
  }
}
