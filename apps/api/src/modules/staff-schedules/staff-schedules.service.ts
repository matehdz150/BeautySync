import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as client from 'src/modules/db/client';
import { staffSchedules } from 'src/modules/db/schema';
import { eq, and } from 'drizzle-orm';
import { CreateStaffScheduleDto } from './dto/create-staff-schedule.dto';
import { UpdateStaffScheduleDto } from './dto/update-staff-schedule.dto';

@Injectable()
export class StaffSchedulesService {
  constructor(@Inject('DB') private db: client.DB) {}

  findForStaff(staffId: string) {
    return this.db.query.staffSchedules.findMany({
      where: eq(staffSchedules.staffId, staffId),

      orderBy: (t, { asc }) => [asc(t.dayOfWeek), asc(t.startTime)],
    });
  }

  validateTimes(start: string, end: string) {
    if (start >= end) {
      throw new BadRequestException('startTime must be before endTime');
    }
  }

  async validateNoOverlap(dto: CreateStaffScheduleDto) {
    const overlaps = await this.db.query.staffSchedules.findMany({
      where: and(
        eq(staffSchedules.staffId, dto.staffId),

        eq(staffSchedules.dayOfWeek, dto.dayOfWeek),
      ),
    });

    const s = dto.startTime;
    const e = dto.endTime;

    for (const o of overlaps) {
      if (!(e <= o.startTime || s >= o.endTime)) {
        throw new BadRequestException('Schedule overlaps existing block');
      }
    }
  }

  async create(dto: CreateStaffScheduleDto) {
    this.validateTimes(dto.startTime, dto.endTime);
    await this.validateNoOverlap(dto);

    const [created] = await this.db
      .insert(staffSchedules)
      .values(dto)
      .returning();

    return created;
  }

  async update(id: number, dto: UpdateStaffScheduleDto) {
    const existing = await this.db.query.staffSchedules.findFirst({
      where: eq(staffSchedules.id, id),
    });

    if (!existing) throw new NotFoundException('Schedule not found');

    const merged = { ...existing, ...dto };

    this.validateTimes(merged.startTime, merged.endTime);

    await this.validateNoOverlap({
      staffId: merged.staffId,

      dayOfWeek: merged.dayOfWeek,

      startTime: merged.startTime,

      endTime: merged.endTime,
    });

    const [updated] = await this.db
      .update(staffSchedules)
      .set(dto)

      .where(eq(staffSchedules.id, id))
      .returning();

    return updated;
  }

  async clearForStaff(staffId: string) {
    await this.db
      .delete(staffSchedules)
      .where(eq(staffSchedules.staffId, staffId));

    return { ok: true };
  }
}
