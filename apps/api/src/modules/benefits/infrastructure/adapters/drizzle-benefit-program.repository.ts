import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { BenefitProgramRepository } from '../../core/ports/benefit-program.repository';
import { benefitPrograms } from 'src/modules/db/schema';
import * as client from 'src/modules/db/client';
import { BenefitProgram } from '../../core/entities/benefit-program.entity';

@Injectable()
export class DrizzleBenefitProgramRepository implements BenefitProgramRepository {
  constructor(@Inject('DB') private db: client.DB) {}

  async findByBranchId(branchId: string) {
    const row = await this.db.query.benefitPrograms.findFirst({
      where: eq(benefitPrograms.branchId, branchId),
    });

    return row ? this.toEntity(row) : null;
  }

  async create(data: { branchId: string; name?: string; isActive: boolean }) {
    const [created] = await this.db
      .insert(benefitPrograms)
      .values({
        branchId: data.branchId,
        name: data.name,
        isActive: data.isActive,
      })
      .returning();

    return this.toEntity(created);
  }

  async update(id: string, data: Partial<{ isActive: boolean; name: string }>) {
    const [updated] = await this.db
      .update(benefitPrograms)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(benefitPrograms.id, id))
      .returning();

    return this.toEntity(updated);
  }

  // 🔥 EL FIX REAL
  private toEntity(row: typeof benefitPrograms.$inferSelect): BenefitProgram {
    return new BenefitProgram(
      row.id,
      row.branchId,
      row.isActive,
      row.name ?? undefined, // 🔥 CLAVE
    );
  }
}
