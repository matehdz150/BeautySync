import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { InferSelectModel } from 'drizzle-orm';

import * as client from 'src/modules/db/client';

import { staffTimeOffRules, staff } from 'src/modules/db/schema';

import { StaffTimeOffRulesRepository } from '../core/ports/staff-timeoff-rules.repository.port';
import { StaffTimeOffRule } from '../core/entities/staff-time-off-rule.entity';

type StaffTimeOffRuleRow = InferSelectModel<typeof staffTimeOffRules>;

@Injectable()
export class DrizzleStaffTimeOffRulesRepository implements StaffTimeOffRulesRepository {
  constructor(@Inject('DB') private db: client.DB) {}

  private map(row: StaffTimeOffRuleRow): StaffTimeOffRule {
    return {
      id: row.id,
      staffId: row.staffId,
      recurrenceType: row.recurrenceType,
      daysOfWeek: row.daysOfWeek ?? undefined,
      startTime: row.startTime,
      endTime: row.endTime,
      startDate: row.startDate,
      endDate: row.endDate ?? undefined,
      reason: row.reason ?? undefined,
      createdAt: row.createdAt,
    };
  }

  async findForStaff(staffId: string): Promise<StaffTimeOffRule[]> {
    const rows = await this.db.query.staffTimeOffRules.findMany({
      where: eq(staffTimeOffRules.staffId, staffId),
      orderBy: (t, { asc }) => [asc(t.startDate)],
    });

    return rows.map((r) => this.map(r));
  }

  async findForBranch(branchId: string): Promise<StaffTimeOffRule[]> {
    const rows = await this.db
      .select()
      .from(staffTimeOffRules)
      .innerJoin(staff, eq(staff.id, staffTimeOffRules.staffId))
      .where(eq(staff.branchId, branchId));

    return rows.map((r) => this.map(r.staff_time_off_rules));
  }

  async create(data: {
    staffId: string;
    recurrenceType: 'NONE' | 'DAILY' | 'WEEKLY';
    daysOfWeek?: number[];
    startTime: string;
    endTime: string;
    startDate: Date;
    endDate?: Date;
    reason?: string;
  }): Promise<StaffTimeOffRule> {
    const [created] = await this.db
      .insert(staffTimeOffRules)
      .values(data)
      .returning();

    return this.map(created);
  }

  async update(
    id: number,
    data: Partial<{
      recurrenceType: 'NONE' | 'DAILY' | 'WEEKLY';
      daysOfWeek?: number[];
      startTime?: string;
      endTime?: string;
      startDate?: Date;
      endDate?: Date;
      reason?: string;
    }>,
  ): Promise<StaffTimeOffRule> {
    const [updated] = await this.db
      .update(staffTimeOffRules)
      .set(data)
      .where(eq(staffTimeOffRules.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException('Time off rule not found');
    }

    return this.map(updated);
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(staffTimeOffRules).where(eq(staffTimeOffRules.id, id));
  }
}
