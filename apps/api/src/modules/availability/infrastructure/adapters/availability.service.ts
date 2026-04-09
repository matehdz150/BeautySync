/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import * as client from 'src/modules/db/client';
import {
  appointments,
  branchSettings,
  services,
  staff,
  staffSchedules,
  staffTimeOff,
  staffServices,
  serviceCategories,
} from 'src/modules/db/schema';
import { and, eq, gte, inArray, InferSelectModel, lt } from 'drizzle-orm';
import { GetAvailabilityDto } from '../../application/dto/create-availability.dto';
import {
  dtToMinutesSinceDayStart,
  mergeIntervals,
  parseTimeToMinutes,
  subtractBusy,
  subtractIntervals,
} from './time-helpers';
import { DateTime } from 'luxon';
import {
  AvailabilityResult,
  StaffAvailability,
} from '../../core/entities/availability.entity';
import { SlotLockPort } from 'src/modules/cache/core/ports/slot-lock.port';
import { SLOT_LOCK_PORT } from 'src/modules/cache/core/ports/tokens';
import { GetAvailableDatesFromIndexUseCase } from '../../core/use-cases/get-available-dates-from-index.use-case';
import { GetSlotsForDayFromIndexUseCase } from '../../core/use-cases/get-slots-for-day-from-index.use-case';
import { AvailabilityIndex } from '../../core/entities/availability-index.entity';
import { AvailabilityIndexCacheService } from './availability-index-cache.service';

type StaffSchedule = InferSelectModel<typeof staffSchedules>;
type StaffTimeOff = InferSelectModel<typeof staffTimeOff>;
type Appointment = InferSelectModel<typeof appointments>;

export const BLOCKING_APPOINTMENT_STATUSES: Appointment['status'][] = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
];

type TimeBlock = {
  startMin: number;
  endMin: number;
};

type DayAvailabilityInput = {
  branchId: string;
  requiredDurationMin: number;
  staffId?: string;
  dates: string[]; // YYYY-MM-DD in branch TZ
};

type GetAvailableDatesInput = {
  branchId: string;
  requiredDurationMin: number;
  staffId?: string;
  month?: string;
};

type DayContext = {
  date: string;
  dayStartLocal: DateTime;
  dayOfWeek: number;
  isToday: boolean;
  isBeyondMaxAhead: boolean;
};

@Injectable()
export class AvailabilityService {
  constructor(
    @Inject('DB') private db: client.DB,
    @Inject(SLOT_LOCK_PORT)
    private readonly slotLock: SlotLockPort,
    private readonly getAvailableDatesFromIndex: GetAvailableDatesFromIndexUseCase,
    private readonly getSlotsForDayFromIndex: GetSlotsForDayFromIndexUseCase,
    private readonly availabilityIndexCache: AvailabilityIndexCacheService,
  ) {}

  async getAvailabilityIndex(params: {
    branchId: string;
    date: string;
  }): Promise<AvailabilityIndex> {
    const anchorDate = DateTime.fromISO(params.date).startOf('day');
    if (!anchorDate.isValid) {
      throw new BadRequestException('Invalid availability date');
    }

    const normalizedStart = anchorDate.startOf('month');
    const normalizedEnd = anchorDate.endOf('month');
    return this.availabilityIndexCache.getOrBuild({
      branchId: params.branchId,
      start: normalizedStart.toUTC().toJSDate(),
      end: normalizedEnd.toUTC().toJSDate(),
    });
  }

  private groupSchedulesByStaffAndDay(
    rows: Pick<StaffSchedule, 'staffId' | 'dayOfWeek' | 'startTime' | 'endTime'>[],
  ) {
    const map = new Map<string, Map<number, TimeBlock[]>>();

    for (const row of rows) {
      const byDay = map.get(row.staffId) ?? new Map<number, TimeBlock[]>();
      const blocks = byDay.get(row.dayOfWeek) ?? [];

      blocks.push({
        startMin: parseTimeToMinutes(row.startTime),
        endMin: parseTimeToMinutes(row.endTime),
      });

      byDay.set(row.dayOfWeek, blocks);
      map.set(row.staffId, byDay);
    }

    return map;
  }

  private appendIntervalByStaffAndDate(
    map: Map<string, Map<string, TimeBlock[]>>,
    staffId: string,
    date: string,
    interval: TimeBlock,
  ) {
    const byDate = map.get(staffId) ?? new Map<string, TimeBlock[]>();
    const list = byDate.get(date) ?? [];

    list.push(interval);
    byDate.set(date, list);
    map.set(staffId, byDate);
  }

  private mergeNestedIntervals(map: Map<string, Map<string, TimeBlock[]>>) {
    for (const byDate of map.values()) {
      for (const [date, intervals] of byDate.entries()) {
        byDate.set(date, mergeIntervals(intervals));
      }
    }
  }

  private buildDayContexts(params: {
    dates: string[];
    tz: string;
    nowLocal: DateTime;
    maxBookingAheadDays: number;
  }): DayContext[] {
    const out: DayContext[] = [];

    for (const date of params.dates) {
      const dayStartLocal = DateTime.fromISO(date, { zone: params.tz }).startOf(
        'day',
      );
      const diffDays = dayStartLocal
        .diff(params.nowLocal.startOf('day'), 'days')
        .days;

      out.push({
        date,
        dayStartLocal,
        dayOfWeek: dayStartLocal.weekday % 7,
        isToday: dayStartLocal.hasSame(params.nowLocal, 'day'),
        isBeyondMaxAhead: diffDays > params.maxBookingAheadDays,
      });
    }

    return out;
  }

  private buildSchedulesByStaffAndDate(
    staffIds: string[],
    dayContexts: DayContext[],
    schedulesByStaffWeekday: Map<string, Map<number, TimeBlock[]>>,
  ) {
    const map = new Map<string, Map<string, TimeBlock[]>>();

    for (const staffId of staffIds) {
      const byDate = new Map<string, TimeBlock[]>();
      const byWeekday = schedulesByStaffWeekday.get(staffId) ?? new Map();

      for (const dayCtx of dayContexts) {
        const blocks = byWeekday.get(dayCtx.dayOfWeek) ?? [];
        byDate.set(dayCtx.date, blocks);
      }

      map.set(staffId, byDate);
    }

    return map;
  }

  private groupBusyIntervalsByStaffAndDate(params: {
    rows: { staffId: string; start: Date; end: Date }[];
    dateSet: Set<string>;
    tz: string;
  }) {
    const map = new Map<string, Map<string, TimeBlock[]>>();

    for (const row of params.rows) {
      const startLocal = DateTime.fromJSDate(row.start).setZone(params.tz);
      const endLocal = DateTime.fromJSDate(row.end).setZone(params.tz);
      if (endLocal <= startLocal) {
        continue;
      }

      let cursor = startLocal.startOf('day');
      const lastDay = endLocal.startOf('day');

      while (cursor <= lastDay) {
        const date = cursor.toISODate();
        if (!date || !params.dateSet.has(date)) {
          cursor = cursor.plus({ days: 1 });
          continue;
        }

        const dayStartLocal = cursor;
        const dayEndLocal = cursor.endOf('day');
        const clampedStart =
          startLocal < dayStartLocal ? dayStartLocal : startLocal;
        const clampedEnd = endLocal > dayEndLocal ? dayEndLocal : endLocal;

        const startMin = dtToMinutesSinceDayStart(clampedStart, dayStartLocal);
        const endMin = dtToMinutesSinceDayStart(clampedEnd, dayStartLocal);

        if (startMin < endMin) {
          this.appendIntervalByStaffAndDate(map, row.staffId, date, {
            startMin,
            endMin,
          });
        }

        cursor = cursor.plus({ days: 1 });
      }
    }

    this.mergeNestedIntervals(map);
    return map;
  }

  private ceilToStep(value: number, step: number) {
    return Math.ceil(value / step) * step;
  }

  private extractDatesFromIndex(params: {
    index: AvailabilityIndex;
    monthStart: DateTime;
    monthEnd: DateTime;
    requiredDurationMin: number;
    staffId?: string;
  }) {
    const dates: string[] = [];
    let cursor = params.monthStart;

    while (cursor <= params.monthEnd && dates.length < 31) {
      dates.push(cursor.toISODate()!);
      cursor = cursor.plus({ days: 1 });
    }

    return this.getAvailableDatesFromIndex.execute({
      index: params.index,
      dates,
      requiredDurationMin: params.requiredDurationMin,
      staffId: params.staffId,
    });
  }

  private hasVisibleStartInIntervals(params: {
    freeIntervals: TimeBlock[];
    requiredTotalMin: number;
    noticeCutoffMin: number;
    stepMin: number;
    lockedStartMinutes: Set<number>;
  }) {
    for (const interval of params.freeIntervals) {
      const startFloor = Math.max(interval.startMin, params.noticeCutoffMin);
      const firstStart = this.ceilToStep(startFloor, params.stepMin);
      const lastStart = interval.endMin - params.requiredTotalMin;

      if (firstStart > lastStart) {
        continue;
      }

      for (let start = firstStart; start <= lastStart; start += params.stepMin) {
        if (!params.lockedStartMinutes.has(start)) {
          return true;
        }
      }
    }

    return false;
  }

  async getAvailableDatesBatch(
    input: DayAvailabilityInput,
  ): Promise<{ date: string; available: boolean }[]> {
    const uniqueDates = [...new Set(input.dates)].filter(Boolean).sort();
    if (!uniqueDates.length) return [];
    const index = await this.getAvailabilityIndex({
      branchId: input.branchId,
      date: uniqueDates[0],
    });

    return this.getAvailableDatesFromIndex.execute({
      index,
      dates: uniqueDates,
      requiredDurationMin: input.requiredDurationMin,
      staffId: input.staffId,
    });
  }

  async getAvailableDates(
    input: GetAvailableDatesInput,
  ): Promise<{ date: string; available: boolean }[]> {
    const base = input.month
      ? DateTime.fromFormat(input.month, 'yyyy-MM')
      : DateTime.now();
    if (!base.isValid) {
      throw new BadRequestException('Invalid month');
    }

    const monthStart = base.startOf('month');
    const monthEnd = base.endOf('month');
    console.log('DATES ENDPOINT USING CACHE ONLY');
    const index = await this.availabilityIndexCache.getCached({
      branchId: input.branchId,
      start: monthStart.toUTC().toJSDate(),
      end: monthEnd.toUTC().toJSDate(),
    });

    if (!index) {
      return [];
    }

    const monthStartIso = monthStart.toISODate()!;
    const monthEndIso = monthEnd.toISODate()!;

    return index.availableDates
      .filter((date) => date >= monthStartIso && date <= monthEndIso)
      .map((date) => ({
        date,
        available: true,
      }));
  }

  async getAvailability(
    query: GetAvailabilityDto,
  ): Promise<AvailabilityResult> {
    const { branchId, serviceId, date, staffId, requiredDurationMin } = query;

    const isByService = typeof serviceId === 'string';
    const index = await this.getAvailabilityIndex({
      branchId,
      date,
    });
    const settings = index.settings;

    let durationMin: number;

    if (typeof requiredDurationMin === 'number') {
      durationMin = requiredDurationMin;
    } else if (serviceId) {
      const duration = index.serviceDurations.get(serviceId);

      if (!duration)
        throw new BadRequestException('Service not found for this branch');
      durationMin = duration;
    } else {
      throw new BadRequestException(
        'serviceId or requiredDurationMin is required',
      );
    }

    let allowedStaffIds: string[] | undefined;

    if (staffId) {
      if (isByService) {
        allowedStaffIds = [staffId];
      }
    }
    const tz = settings.timezone;
    const nowLocal = DateTime.now().setZone(tz);
    const normalizedDayStartLocal = DateTime.fromISO(date, { zone: tz }).startOf(
      'day',
    );
    const diffDays = normalizedDayStartLocal
      .startOf('day')
      .diff(nowLocal.startOf('day'), 'days').days;

    if (diffDays > settings.maxBookingAheadDays)
      throw new BadRequestException('Date is beyond max booking ahead window');

    const snapshotStaffIds = index.byDay.get(date)?.staffIds ?? [];
    if (!snapshotStaffIds.length) {
      return new AvailabilityResult(branchId, date, []);
    }

    if (staffId) {
      const isActive = index.activeStaffIds.includes(staffId);
      if (!isActive) {
        throw new BadRequestException('Staff is not active in this branch');
      }
    }

    if (isByService) {
      const eligibleStaffIds = new Set(
        index.staffIdsByService.get(serviceId) ?? [],
      );
      if (staffId && !eligibleStaffIds.has(staffId)) {
        throw new BadRequestException('Staff cannot perform this service');
      }

      allowedStaffIds = staffId
        ? [staffId]
        : snapshotStaffIds.filter((id) => eligibleStaffIds.has(id));
    } else {
      allowedStaffIds = snapshotStaffIds;
    }

    if (!allowedStaffIds.length) {
      return new AvailabilityResult(branchId, date, []);
    }

    const lockedByStaff = await this.slotLock.listLockedStarts({
      branchId,
      staffIds: allowedStaffIds,
      date,
    });

    return this.getSlotsForDayFromIndex.execute({
      index,
      date,
      branchId,
      settings,
      requiredDurationMin: durationMin,
      staffIds: allowedStaffIds,
      lockedStartsByStaff: lockedByStaff,
    });
  }

  async getAvailableServicesForSlot(params: {
    branchId: string;
    staffId: string;
    datetime: string;
  }): Promise<
    {
      id: string;
      name: string;
      durationMin: number;
      priceCents: number | null;
      category: {
        id: string | null;
        name: string | null;
        colorHex: string | null;
      } | null;
    }[]
  > {
    const { branchId, staffId, datetime } = params;

    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branchId),
    });

    const tz = settings?.timezone ?? 'America/Mexico_City';
    const bufferBefore = settings?.bufferBeforeMin ?? 0;
    const bufferAfter = settings?.bufferAfterMin ?? 0;

    const start = DateTime.fromISO(datetime, { zone: tz });
    const dayStart = start.startOf('day');
    const dayEnd = start.endOf('day');

    const staffRow = await this.db.query.staff.findFirst({
      where: and(
        eq(staff.id, staffId),
        eq(staff.branchId, branchId),
        eq(staff.isActive, true),
      ),
    });

    if (!staffRow) throw new BadRequestException('Invalid staff');

    const srvList = await this.db
      .select({
        id: services.id,
        name: services.name,
        durationMin: services.durationMin,
        priceCents: services.priceCents,
        category: {
          id: serviceCategories.id,
          name: serviceCategories.name,
          colorHex: serviceCategories.colorHex,
        },
      })
      .from(staffServices)
      .innerJoin(services, eq(services.id, staffServices.serviceId))
      .leftJoin(
        serviceCategories,
        eq(serviceCategories.id, services.categoryId),
      )
      .where(eq(staffServices.staffId, staffId));

    if (srvList.length === 0) return [];

    const schedules: StaffSchedule[] = await this.db
      .select()
      .from(staffSchedules)
      .where(
        and(
          eq(staffSchedules.staffId, staffId),
          eq(staffSchedules.dayOfWeek, start.weekday % 7),
        ),
      );

    if (schedules.length === 0) return [];

    let freeBlocks: TimeBlock[] = schedules.map((s) => ({
      startMin: parseTimeToMinutes(s.startTime),
      endMin: parseTimeToMinutes(s.endTime),
    }));

    const timeOff: StaffTimeOff[] = await this.db
      .select()
      .from(staffTimeOff)
      .where(
        and(
          eq(staffTimeOff.staffId, staffId),
          lt(staffTimeOff.start, dayEnd.toUTC().toJSDate()),
          gte(staffTimeOff.end, dayStart.toUTC().toJSDate()),
        ),
      );

    const busyOff: TimeBlock[] = timeOff.map((t) => ({
      startMin: dtToMinutesSinceDayStart(
        DateTime.fromJSDate(t.start).setZone(tz),
        dayStart,
      ),
      endMin: dtToMinutesSinceDayStart(
        DateTime.fromJSDate(t.end).setZone(tz),
        dayStart,
      ),
    }));

    freeBlocks = subtractBusy(freeBlocks, busyOff);

    const appointmentsToday: Appointment[] = await this.db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.staffId, staffId),
          eq(appointments.branchId, branchId),
          lt(appointments.start, dayEnd.toUTC().toJSDate()),
          gte(appointments.end, dayStart.toUTC().toJSDate()),
          inArray(appointments.status, BLOCKING_APPOINTMENT_STATUSES),
        ),
      );

    const busyApps: TimeBlock[] = appointmentsToday.map((a) => ({
      startMin: dtToMinutesSinceDayStart(
        DateTime.fromJSDate(a.start).setZone(tz),
        dayStart,
      ),
      endMin: dtToMinutesSinceDayStart(
        DateTime.fromJSDate(a.end).setZone(tz),
        dayStart,
      ),
    }));

    freeBlocks = subtractBusy(freeBlocks, busyApps);

    const startMin = dtToMinutesSinceDayStart(start, dayStart);

    const availableServices: {
      id: string;
      name: string;
      durationMin: number;
      priceCents: number | null;
      category: {
        id: string | null;
        name: string | null;
        colorHex: string | null;
      } | null;
    }[] = [];

    for (const s of srvList) {
      const total = s.durationMin + bufferBefore + bufferAfter;
      const endMin = startMin + total;

      const fits = freeBlocks.some(
        (b) => startMin >= b.startMin && endMin <= b.endMin,
      );

      if (!fits) continue;

      const startIso = start.toUTC().toISO()!;
      const endIso = start.plus({ minutes: total }).toUTC().toISO()!;

      const isLocked = await this.slotLock.isRangeLocked({
        branchId,
        staffId,
        startIso,
        endIso,
      });

      if (isLocked) continue;

      availableServices.push(s);
    }

    return availableServices;
  }

  async getAvailableServicesAt(params: { branchId: string; datetime: string }) {
    const { branchId, datetime } = params;

    // 1️⃣ Settings
    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branchId),
    });

    const tz = settings?.timezone ?? 'America/Mexico_City';

    const startLocal = DateTime.fromISO(datetime, { zone: tz });
    if (!startLocal.isValid) {
      throw new BadRequestException('Invalid datetime');
    }

    const date = startLocal.toISODate(); // YYYY-MM-DD

    // ⏱️ normalizar start al step de 15 min (UTC)
    const startUtcStep = startLocal
      .toUTC()
      .startOf('minute')
      .plus({ minutes: (15 - (startLocal.minute % 15)) % 15 })
      .toISO();

    // 2️⃣ Servicios activos del branch
    const activeServices = await this.db.query.services.findMany({
      where: and(eq(services.branchId, branchId), eq(services.isActive, true)),
      with: {
        category: true,
      },
    });

    if (!activeServices.length) return [];

    // 3️⃣ Resultado final
    const available: {
      id: string;
      name: string;
      durationMin: number;
      priceCents: number;
      categoryColor: string | null;
      allowAny: boolean;
      staff: {
        id: string;
        name: string;
        avatarUrl?: string | null;
      }[];
    }[] = [];

    // 4️⃣ Probar cada servicio
    for (const srv of activeServices) {
      try {
        const availability = await this.getAvailability({
          branchId,
          serviceId: srv.id,
          date,
        });

        // staff que pueden empezar EXACTAMENTE en este slot
        const eligibleStaffIds = availability.staff
          .filter((s) => s.slots.includes(startUtcStep))
          .map((s) => s.staffId);

        if (!eligibleStaffIds.length) continue;

        const staffMembers = await this.db.query.staff.findMany({
          where: and(
            eq(staff.branchId, branchId),
            inArray(staff.id, eligibleStaffIds),
            eq(staff.isActive, true),
          ),
        });

        available.push({
          id: srv.id,
          name: srv.name,
          durationMin: srv.durationMin,
          priceCents: srv.priceCents ?? 0,
          categoryColor: srv.category?.colorHex ?? null,

          allowAny: staffMembers.length > 1,

          staff: staffMembers.map((st) => ({
            id: st.id,
            name: st.name,
            avatarUrl: st.avatarUrl ?? null,
          })),
        });
      } catch {
        // si algo falla en disponibilidad → se ignora el servicio
        continue;
      }
    }

    return available;
  }
}
