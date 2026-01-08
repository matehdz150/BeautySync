/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as client from 'src/db/client';
import { staffSchedules } from 'src/db/schema';
import { eq, and } from 'drizzle-orm';
import { CreateStaffScheduleDto } from './dto/create-staff-schedule.dto';
import { UpdateStaffScheduleDto } from './dto/update-staff-schedule.dto';

@Injectable()
export class StaffSchedulesService {
  constructor(@Inject('DB') private db: client.DB) {}

  findForStaff(staffId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.query.staffSchedules.findMany({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where: eq(staffSchedules.staffId, staffId),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      orderBy: (t, { asc }) => [asc(t.dayOfWeek), asc(t.startTime)],
    });
  }

  validateTimes(start: string, end: string) {
    if (start >= end) {
      throw new BadRequestException('startTime must be before endTime');
    }
  }

  async validateNoOverlap(dto: CreateStaffScheduleDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const overlaps = await this.db.query.staffSchedules.findMany({
      where: and(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        eq(staffSchedules.staffId, dto.staffId),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        eq(staffSchedules.dayOfWeek, dto.dayOfWeek),
      ),
    });

    const s = dto.startTime;
    const e = dto.endTime;

    for (const o of overlaps) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return created;
  }

  async update(id: number, dto: UpdateStaffScheduleDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const existing = await this.db.query.staffSchedules.findFirst({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where: eq(staffSchedules.id, id),
    });

    if (!existing) throw new NotFoundException('Schedule not found');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const merged = { ...existing, ...dto };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    this.validateTimes(merged.startTime, merged.endTime);

    await this.validateNoOverlap({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      staffId: merged.staffId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      dayOfWeek: merged.dayOfWeek,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      startTime: merged.startTime,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      endTime: merged.endTime,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [updated] = await this.db
      .update(staffSchedules)
      .set(dto)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .where(eq(staffSchedules.id, id))
      .returning();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return updated;
  }

  async remove(id: number) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await this.db.delete(staffSchedules).where(eq(staffSchedules.id, id));
    return { success: true };
  }
}
