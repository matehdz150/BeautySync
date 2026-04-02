import { Injectable } from '@nestjs/common';
import { db } from 'src/modules/db/client';
import { eq } from 'drizzle-orm';

import { benefitTiers } from 'src/modules/db/schema';

import { BenefitTiersRepository } from '../../core/ports/benefit-tier.repository';

import { BenefitTier } from '../../core/entities/benefit-tier.entity';

@Injectable()
export class DrizzleBenefitTiersRepository implements BenefitTiersRepository {
  // =========================
  // GET BY PROGRAM
  // =========================
  async getByProgram(programId: string) {
    const rows = await db
      .select({
        id: benefitTiers.id,
        minPoints: benefitTiers.minPoints,
        position: benefitTiers.position,
      })
      .from(benefitTiers)
      .where(eq(benefitTiers.programId, programId));

    return rows;
  }

  // =========================
  // CREATE
  // =========================
  async create(input: {
    programId: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    minPoints: number;
    position: number;
  }): Promise<BenefitTier> {
    const [row] = await db
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

    // 🔥 mapping explícito (hexagonal clean)
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
}
