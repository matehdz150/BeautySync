import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as client from 'src/db/client';
import { staffTimeOff } from 'src/db/schema';
import { eq } from 'drizzle-orm';
import { CreateStaffTimeOffDto } from './dto/create-staff-time-off.dto';

@Injectable()
export class StaffTimeOffService {
  constructor(@Inject('DB') private db: client.DB) {}

  findForStaff(staffId: string) {
    return this.db.query.staffTimeOff.findMany({
      where: eq(staffTimeOff.staffId, staffId),

      orderBy: (t, { asc }) => [asc(t.start)],
    });
  }

  async create(dto: CreateStaffTimeOffDto) {
    const [created] = await this.db
      .insert(staffTimeOff)
      .values({
        staffId: dto.staffId,
        start: new Date(dto.start), // <-- 🔥 conversión correcta
        end: new Date(dto.end),
        reason: dto.reason,
      })
      .returning();

    return created;
  }

  async remove(id: number) {
    const result = await this.db
      .delete(staffTimeOff)

      .where(eq(staffTimeOff.id, id))
      .returning();

    if (!result.length) throw new NotFoundException('Time off not found');

    return { success: true };
  }
}
