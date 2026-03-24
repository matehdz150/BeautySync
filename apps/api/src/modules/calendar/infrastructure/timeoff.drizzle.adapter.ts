import { and, eq, lt, gt, SQL } from 'drizzle-orm';
import { db } from 'src/modules/db/client';

import { TimeOffPort } from '../core/ports/timeoff.port';
import { staffTimeOff } from 'src/modules/db/schema/staff/staffTimeOff';

export class TimeOffDrizzleAdapter implements TimeOffPort {
  async findByBranchAndRange(params: {
    branchId: string;
    start: Date;
    end: Date;
    staffId?: string;
  }) {
    const { branchId, start, end, staffId } = params;

    const conditions: SQL[] = [
      eq(staffTimeOff.branchId, branchId),

      // 🔥 OVERLAP REAL
      lt(staffTimeOff.start, end),
      gt(staffTimeOff.end, start),
    ];

    if (staffId) {
      conditions.push(eq(staffTimeOff.staffId, staffId));
    }

    const rows = await db
      .select({
        id: staffTimeOff.id,
        staffId: staffTimeOff.staffId,
        start: staffTimeOff.start,
        end: staffTimeOff.end,
        reason: staffTimeOff.reason,
      })
      .from(staffTimeOff)
      .where(and(...conditions));

    return rows.map((r) => ({
      id: r.id,
      staffId: r.staffId,
      start: r.start,
      end: r.end,
      reason: r.reason ?? undefined,
    }));
  }
}
