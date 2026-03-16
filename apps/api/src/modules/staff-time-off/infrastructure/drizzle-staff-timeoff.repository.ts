import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, InferSelectModel } from 'drizzle-orm';

import * as client from 'src/modules/db/client';
import { staff, staffTimeOff } from 'src/modules/db/schema';

import { StaffTimeOffRepository } from '../core/ports/staff-timeoff.repository.port';
import { StaffTimeOff } from '../core/entities/staff-time-off-entity';

type StaffTimeOffRow = InferSelectModel<typeof staffTimeOff>;

@Injectable()
export class DrizzleStaffTimeOffRepository implements StaffTimeOffRepository {
  constructor(@Inject('DB') private db: client.DB) {}

  private map(row: StaffTimeOffRow): StaffTimeOff {
    return {
      id: row.id,
      staffId: row.staffId,
      start: row.start,
      end: row.end,
      reason: row.reason ?? undefined,
    };
  }

  async findForStaff(staffId: string): Promise<StaffTimeOff[]> {
    const rows = await this.db.query.staffTimeOff.findMany({
      where: eq(staffTimeOff.staffId, staffId),
      orderBy: (t, { asc }) => [asc(t.start)],
    });

    return rows.map((r) => this.map(r));
  }

  async create(data: {
    staffId: string;
    start: Date;
    end: Date;
    reason?: string;
  }): Promise<StaffTimeOff> {
    const [created] = await this.db
      .insert(staffTimeOff)
      .values(data)
      .returning();

    return this.map(created);
  }

  async createMany(
    data: {
      staffId: string;
      start: Date;
      end: Date;
      reason?: string;
    }[],
  ): Promise<void> {
    if (!data.length) return;

    await this.db.insert(staffTimeOff).values(data);
  }

  async update(
    id: number,
    data: Partial<{
      start: Date;
      end: Date;
      reason?: string;
    }>,
  ): Promise<StaffTimeOff> {
    const [updated] = await this.db
      .update(staffTimeOff)
      .set(data)
      .where(eq(staffTimeOff.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException('Time off not found');
    }

    return this.map(updated);
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(staffTimeOff).where(eq(staffTimeOff.id, id));
  }

  async findForBranch(branchId: string): Promise<StaffTimeOff[]> {
    const rows = await this.db
      .select()
      .from(staffTimeOff)
      .innerJoin(staff, eq(staff.id, staffTimeOff.staffId))
      .where(eq(staff.branchId, branchId));

    return rows.map((r) => this.map(r.staff_time_off));
  }
}
