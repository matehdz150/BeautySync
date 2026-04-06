import { Inject, Injectable } from '@nestjs/common';
import { DB, DbOrTx } from '../../../db/client';
import { eq } from 'drizzle-orm';

import { benefitPrograms, benefitTiers, branches } from '../../../db/schema';

import { BenefitTiersRepository } from '../../core/ports/benefit-tier.repository';

import { BenefitTier } from '../../core/entities/benefit-tier.entity';
import { benefitTierRewards } from '../../../db/schema';

@Injectable()
export class DrizzleBenefitTiersRepository implements BenefitTiersRepository {
  constructor(@Inject('DB') private readonly db: DB) {}
  // =========================
  // GET BY PROGRAM
  // =========================
  async getByProgram(programId: string, db?: DbOrTx) {
    const dbInstance = db ?? this.db;

    const rows = await dbInstance
      .select({
        id: benefitTiers.id,
        minPoints: benefitTiers.minPoints,
        position: benefitTiers.position,
        name: benefitTiers.name,
        color: benefitTiers.color,
        icon: benefitTiers.icon,
      })
      .from(benefitTiers)
      .where(eq(benefitTiers.programId, programId));

    return rows;
  }

  // =========================
  // CREATE
  // =========================
  async create(
    input: {
      programId: string;
      name: string;
      description: string | null;
      color: string | null;
      icon: string | null;
      minPoints: number;
      position: number;
    },
    tx?: DbOrTx,
  ): Promise<BenefitTier> {
    const dbInstance = tx ?? this.db;

    const [row] = await dbInstance
      .insert(benefitTiers)
      .values({
        programId: input.programId,
        name: input.name,
        description: input.description,
        color: input.color,
        icon: input.icon,
        minPoints: input.minPoints,
        position: input.position,
      })
      .returning();

    return {
      id: row.id,
      programId: row.programId,
      name: row.name,
      description: row.description,
      color: row.color,
      icon: row.icon,
      minPoints: row.minPoints,
      position: row.position,
      createdAt: row.createdAt,
    };
  }

  async findById(id: string, db?: DbOrTx): Promise<BenefitTier | null> {
    const dbInstance = db ?? this.db;

    const [row] = await dbInstance
      .select()
      .from(benefitTiers)
      .where(eq(benefitTiers.id, id))
      .limit(1);

    if (!row) return null;

    return {
      id: row.id,
      programId: row.programId,
      name: row.name,
      description: row.description,
      color: row.color,
      icon: row.icon,
      minPoints: row.minPoints,
      position: row.position,
      createdAt: row.createdAt,
    };
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      color: string | null;
      icon: string | null;
      minPoints: number;
    }>,
    tx?: DbOrTx,
  ): Promise<BenefitTier> {
    const dbInstance = tx ?? this.db;

    const [row] = await dbInstance
      .update(benefitTiers)
      .set({
        ...data,
      })
      .where(eq(benefitTiers.id, id))
      .returning();

    return {
      id: row.id,
      programId: row.programId,
      name: row.name,
      description: row.description,
      color: row.color,
      icon: row.icon,
      minPoints: row.minPoints,
      position: row.position,
      createdAt: row.createdAt,
    };
  }

  async deleteByTier(tierId: string, tx?: DbOrTx) {
    const dbInstance = tx ?? this.db;

    await dbInstance
      .delete(benefitTierRewards)
      .where(eq(benefitTierRewards.tierId, tierId));
  }

  async delete(id: string, db?: DbOrTx) {
    const dbInstance = db ?? this.db;

    await dbInstance.delete(benefitTiers).where(eq(benefitTiers.id, id));
  }

  async findByIdWithContext(tierId: string) {
    const result = await this.db
      .select({
        // TIER
        tier: {
          id: benefitTiers.id,
          programId: benefitTiers.programId,
          name: benefitTiers.name,
          description: benefitTiers.description,
          color: benefitTiers.color,
          icon: benefitTiers.icon,
          minPoints: benefitTiers.minPoints,
          position: benefitTiers.position,
          createdAt: benefitTiers.createdAt,
        },

        // PROGRAM
        program: {
          id: benefitPrograms.id,
          branchId: benefitPrograms.branchId,
          isActive: benefitPrograms.isActive,
        },

        // BRANCH
        branch: {
          id: branches.id,
          organizationId: branches.organizationId,
        },
      })
      .from(benefitTiers)
      .innerJoin(
        benefitPrograms,
        eq(benefitPrograms.id, benefitTiers.programId),
      )
      .innerJoin(branches, eq(branches.id, benefitPrograms.branchId))
      .where(eq(benefitTiers.id, tierId))
      .limit(1);

    const row = result[0];

    if (!row) return null;

    return row;
  }
}
