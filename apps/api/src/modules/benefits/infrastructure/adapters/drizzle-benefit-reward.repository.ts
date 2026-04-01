import { Inject, Injectable } from '@nestjs/common';
import {
  BenefitReward,
  BenefitRewardRepository,
} from '../../core/ports/benefit-reward.repository';
import { DB } from 'src/modules/db/client';
import { and, eq } from 'drizzle-orm';
import { benefitRewards } from 'src/modules/db/schema';

@Injectable()
export class DrizzleBenefitRewardRepository implements BenefitRewardRepository {
  constructor(@Inject('DB') private readonly db: DB) {}

  async findById(id: string): Promise<BenefitReward | null> {
    const r = await this.db.query.benefitRewards.findFirst({
      where: eq(benefitRewards.id, id),
    });

    if (!r) return null;

    return {
      id: r.id,
      programId: r.programId,
      type: r.type,

      name: r.name, // 🔥 ESTE ES EL FIX

      referenceId: r.referenceId ?? null,

      pointsCost: r.pointsCost,
      isActive: r.isActive,

      config:
        r.config && typeof r.config === 'object'
          ? (r.config as Record<string, unknown>)
          : undefined,
    };
  }

  async findActiveByProgram(programId: string): Promise<BenefitReward[]> {
    const rows = await this.db.query.benefitRewards.findMany({
      where: and(
        eq(benefitRewards.programId, programId),
        eq(benefitRewards.isActive, true),
      ),
    });

    return rows.map((r) => ({
      id: r.id,
      programId: r.programId,
      type: r.type,

      name: r.name,

      referenceId: r.referenceId ?? null,

      pointsCost: r.pointsCost,
      isActive: r.isActive,

      stock: r.stock ?? null,
      config:
        r.config && typeof r.config === 'object'
          ? (r.config as Record<string, unknown>)
          : undefined,
    }));
  }
  async create(data: {
    programId: string;
    type: BenefitReward['type'];
    name: string;
    pointsCost: number;
    referenceId?: string | null;
    stock?: number | null;
    config?: Record<string, unknown>;
    isActive: boolean;
  }): Promise<BenefitReward> {
    const [row] = await this.db
      .insert(benefitRewards)
      .values({
        programId: data.programId,
        type: data.type,
        name: data.name,
        pointsCost: data.pointsCost,
        referenceId: data.referenceId ?? null,
        stock: data.stock ?? null,
        config: data.config ?? {},
        isActive: data.isActive,
      })
      .returning();

    return this.mapToEntity(row);
  }

  // =========================
  // MAPPER 🔥 IMPORTANTE
  // =========================
  private mapToEntity(row: typeof benefitRewards.$inferSelect): BenefitReward {
    return {
      id: row.id,
      programId: row.programId,
      type: row.type,
      name: row.name,
      referenceId: row.referenceId ?? null,
      pointsCost: row.pointsCost,
      isActive: row.isActive,
      config:
        typeof row.config === 'object' && row.config !== null
          ? (row.config as Record<string, unknown>)
          : undefined,
    };
  }
}
