import { Inject, Injectable } from '@nestjs/common';
import {
  BenefitReward,
  BenefitRewardRepository,
} from '../../core/ports/benefit-reward.repository';
import { DB } from '../../../db/client';
import { and, eq } from 'drizzle-orm';
import { benefitRewards } from '../../../db/schema';

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

  // =========================
  // UPDATE
  // =========================
  async update(
    id: string,
    data: {
      type?: BenefitReward['type'];
      name?: string;
      pointsCost?: number;
      referenceId?: string | null;
      stock?: number | null;
      config?: Record<string, unknown>;
      isActive?: boolean;
    },
  ): Promise<BenefitReward> {
    const updateData: Partial<typeof benefitRewards.$inferInsert> = {};

    if (data.type !== undefined) {
      updateData.type = data.type;
    }

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.pointsCost !== undefined) {
      updateData.pointsCost = data.pointsCost;
    }

    if (data.referenceId !== undefined) {
      updateData.referenceId = data.referenceId;
    }

    if (data.stock !== undefined) {
      updateData.stock = data.stock;
    }

    if (data.config !== undefined) {
      updateData.config = data.config;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    const [row] = await this.db
      .update(benefitRewards)
      .set(updateData)
      .where(eq(benefitRewards.id, id))
      .returning();

    if (!row) {
      throw new Error('Reward not found after update');
    }

    return this.mapToEntity(row);
  }

  // =========================
  // DELETE
  // =========================
  async delete(id: string): Promise<void> {
    await this.db.delete(benefitRewards).where(eq(benefitRewards.id, id));
  }
}
