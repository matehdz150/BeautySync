import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as client from 'src/modules/db/client';
import { staff, staffSchedules } from 'src/modules/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { CreateStaffScheduleDto } from './dto/create-staff-schedule.dto';
import { UpdateStaffScheduleDto } from './dto/update-staff-schedule.dto';
import { AvailabilityCacheService } from '../availability/infrastructure/adapters/availability-cache.service';
import { AvailabilitySnapshotWarmService } from '../availability/infrastructure/adapters/availability-snapshot-warm.service';
import { CACHE_PORT } from '../cache/core/ports/tokens';
import { CachePort } from '../cache/core/ports/cache.port';

type StaffScheduleRecord = Awaited<
  ReturnType<StaffSchedulesService['findForStaff']>
>[number];

@Injectable()
export class StaffSchedulesService {
  constructor(
    @Inject('DB') private db: client.DB,
    private readonly availabilityCache: AvailabilityCacheService,
    private readonly availabilityWarm: AvailabilitySnapshotWarmService,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  findForStaff(staffId: string) {
    return this.db.query.staffSchedules.findMany({
      where: eq(staffSchedules.staffId, staffId),

      orderBy: (t, { asc }) => [asc(t.dayOfWeek), asc(t.startTime)],
    });
  }

  findForStaffIds(staffIds: string[]) {
    if (!staffIds.length) return Promise.resolve([]);

    return this.db.query.staffSchedules.findMany({
      where: inArray(staffSchedules.staffId, staffIds),
      orderBy: (t, { asc }) => [
        asc(t.staffId),
        asc(t.dayOfWeek),
        asc(t.startTime),
      ],
    });
  }

  async findGroupedForStaffIds(staffIds: string[]) {
    const uniqueStaffIds = [...new Set(staffIds.filter(Boolean))];

    if (!uniqueStaffIds.length) {
      return { staffSchedules: {} as Record<string, StaffScheduleRecord[]> };
    }

    const schedules = await this.findForStaffIds(uniqueStaffIds);
    const grouped = Object.fromEntries(
      uniqueStaffIds.map((staffId) => [staffId, [] as StaffScheduleRecord[]]),
    );

    for (const schedule of schedules) {
      grouped[schedule.staffId] ??= [];
      grouped[schedule.staffId].push(schedule);
    }

    return {
      staffSchedules: grouped,
    };
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

    const staffRow = await this.db.query.staff.findFirst({
      columns: { branchId: true },
      where: eq(staff.id, dto.staffId),
    });
    if (staffRow?.branchId) {
      await Promise.all([
        this.availabilityCache.invalidate(staffRow.branchId),
        this.cache.del(`staff:snapshot:branch:${staffRow.branchId}`),
        this.availabilityWarm.enqueueNextDays(staffRow.branchId, 14),
      ]);
    }

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

    const staffRow = await this.db.query.staff.findFirst({
      columns: { branchId: true },
      where: eq(staff.id, merged.staffId),
    });
    if (staffRow?.branchId) {
      await Promise.all([
        this.availabilityCache.invalidate(staffRow.branchId),
        this.cache.del(`staff:snapshot:branch:${staffRow.branchId}`),
        this.availabilityWarm.enqueueNextDays(staffRow.branchId, 14),
      ]);
    }

    return updated;
  }

  async clearForStaff(staffId: string) {
    const staffRow = await this.db.query.staff.findFirst({
      columns: { branchId: true },
      where: eq(staff.id, staffId),
    });
    await this.db
      .delete(staffSchedules)
      .where(eq(staffSchedules.staffId, staffId));
    if (staffRow?.branchId) {
      await Promise.all([
        this.availabilityCache.invalidate(staffRow.branchId),
        this.cache.del(`staff:snapshot:branch:${staffRow.branchId}`),
        this.availabilityWarm.enqueueNextDays(staffRow.branchId, 14),
      ]);
    }

    return { ok: true };
  }
}
