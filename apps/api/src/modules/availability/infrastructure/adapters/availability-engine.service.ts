import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, gte, lt } from 'drizzle-orm';

import type { DB } from 'src/modules/db/client';
import {
  appointments,
  services,
  staff,
  staffSchedules,
  staffServices,
  staffTimeOff,
} from 'src/modules/db/schema';
import { requestContext } from 'src/modules/metrics/request-context';
import { BranchSettingsCacheService } from 'src/modules/cache/application/branch-settings-cache.service';
import { BranchServicesCacheService } from 'src/modules/cache/application/branch-services-cache.service';
import { BranchStaffCacheService } from 'src/modules/cache/application/branch-staff-cache.service';
import { BLOCKING_APPOINTMENT_STATUSES } from 'src/modules/lib/booking/booking.constants';

export type AvailabilitySnapshotInput = {
  branchId: string;
  rangeStartUtc: Date;
  rangeEndUtc: Date;
  dayOfWeeks: number[];
  staffIds?: string[];
};

export type AvailabilitySnapshot = {
  settings: Awaited<ReturnType<AvailabilityEngine['getBranchSettings']>>;
  staffIds: string[];
  schedules: Awaited<ReturnType<AvailabilityEngine['getSchedules']>>;
  timeOff: Awaited<ReturnType<AvailabilityEngine['getTimeOff']>>;
  appointments: Awaited<ReturnType<AvailabilityEngine['getAppointments']>>;
};

@Injectable()
export class AvailabilityEngine {
  constructor(
    @Inject('DB')
    private readonly db: DB,
    private readonly branchSettingsCache: BranchSettingsCacheService,
    private readonly branchServicesCache: BranchServicesCacheService,
    private readonly branchStaffCache: BranchStaffCacheService,
  ) {}

  getBranchSettings(branchId: string) {
    return this.branchSettingsCache.get(branchId);
  }

  async getServiceDuration(branchId: string, serviceId: string) {
    const servicesMap = await this.branchServicesCache.getActiveMap(branchId);
    const service = servicesMap.get(serviceId);

    if (!service) {
      return null;
    }

    return service.durationMin;
  }

  async getServiceDurations(branchId: string, serviceIds: string[]) {
    const servicesMap = await this.branchServicesCache.getActiveMap(branchId);
    return new Map(
      serviceIds
        .map((serviceId) => {
          const service = servicesMap.get(serviceId);
          return service ? ([serviceId, service.durationMin] as const) : null;
        })
        .filter((entry): entry is readonly [string, number] => entry !== null),
    );
  }

  async getActiveStaffIds(branchId: string) {
    const staffMap = await this.branchStaffCache.getActiveMap(branchId);
    return [...staffMap.keys()];
  }

  async validateActiveStaff(branchId: string, staffIds: string[]) {
    const staffMap = await this.branchStaffCache.getActiveMap(branchId);
    return staffIds.every((staffId) => staffMap.has(staffId));
  }

  async getEligibleStaffIds(branchId: string, serviceId: string) {
    const map = await this.getEligibleStaffByServices(branchId, [serviceId]);
    return map.get(serviceId) ?? [];
  }

  async getEligibleStaffByServices(branchId: string, serviceIds: string[]) {
    const uniqueServiceIds = [...new Set(serviceIds)].sort();
    if (!uniqueServiceIds.length) {
      return new Map<string, string[]>();
    }

    return requestContext.memo(
      `availability:eligible_staff_batch:${branchId}:${uniqueServiceIds.join(',')}`,
      async () => {
        const rows = await this.db
          .select({
            serviceId: staffServices.serviceId,
            staffId: staffServices.staffId,
          })
          .from(staffServices)
          .innerJoin(
            staff,
            and(
              eq(staff.id, staffServices.staffId),
              eq(staff.branchId, branchId),
              eq(staff.isActive, true),
            ),
          )
          .where(inArray(staffServices.serviceId, uniqueServiceIds));

        const map = new Map<string, string[]>();

        for (const serviceId of uniqueServiceIds) {
          map.set(serviceId, []);
        }

        for (const row of rows) {
          const current = map.get(row.serviceId) ?? [];
          current.push(row.staffId);
          map.set(row.serviceId, current);
        }

        return map;
      },
    );
  }

  async getSchedules(staffIds: string[], dayOfWeeks: number[]) {
    if (!staffIds.length || !dayOfWeeks.length) {
      return [];
    }

    return requestContext.getOrSet(
      `availability:schedules:${staffIds.join(',')}:${dayOfWeeks.join(',')}`,
      () =>
        this.db
          .select({
            staffId: staffSchedules.staffId,
            dayOfWeek: staffSchedules.dayOfWeek,
            startTime: staffSchedules.startTime,
            endTime: staffSchedules.endTime,
          })
          .from(staffSchedules)
          .where(
            and(
              inArray(staffSchedules.staffId, staffIds),
              inArray(staffSchedules.dayOfWeek, dayOfWeeks),
            ),
          ),
    );
  }

  async getTimeOff(staffIds: string[], rangeStartUtc: Date, rangeEndUtc: Date) {
    if (!staffIds.length) {
      return [];
    }

    return requestContext.getOrSet(
      `availability:timeoff:${staffIds.join(',')}:${rangeStartUtc.toISOString()}:${rangeEndUtc.toISOString()}`,
      () =>
        this.db
          .select({
            staffId: staffTimeOff.staffId,
            start: staffTimeOff.start,
            end: staffTimeOff.end,
          })
          .from(staffTimeOff)
          .where(
            and(
              inArray(staffTimeOff.staffId, staffIds),
              lt(staffTimeOff.start, rangeEndUtc),
              gte(staffTimeOff.end, rangeStartUtc),
            ),
          ),
    );
  }

  async getAppointments(branchId: string, staffIds: string[], rangeStartUtc: Date, rangeEndUtc: Date) {
    if (!staffIds.length) {
      return [];
    }

    return requestContext.getOrSet(
      `availability:appointments:${branchId}:${staffIds.join(',')}:${rangeStartUtc.toISOString()}:${rangeEndUtc.toISOString()}`,
      () =>
        this.db
          .select({
            staffId: appointments.staffId,
            start: appointments.start,
            end: appointments.end,
          })
          .from(appointments)
          .where(
            and(
              eq(appointments.branchId, branchId),
              inArray(appointments.staffId, staffIds),
              lt(appointments.start, rangeEndUtc),
              gte(appointments.end, rangeStartUtc),
              inArray(appointments.status, BLOCKING_APPOINTMENT_STATUSES),
            ),
          ),
    );
  }

  async loadSnapshot(input: AvailabilitySnapshotInput): Promise<AvailabilitySnapshot> {
    const normalizedStaffIds = input.staffIds
      ? [...new Set(input.staffIds)].sort()
      : undefined;
    const normalizedDayOfWeeks = [...new Set(input.dayOfWeeks)].sort(
      (a, b) => a - b,
    );

    return requestContext.memo(
      `availability:snapshot:${input.branchId}:${input.rangeStartUtc.toISOString()}:${input.rangeEndUtc.toISOString()}:${normalizedDayOfWeeks.join(',')}:${normalizedStaffIds?.join(',') ?? 'ALL'}`,
      async () => {
        const settings = await this.getBranchSettings(input.branchId);

        let staffIds = normalizedStaffIds;
        if (!staffIds?.length) {
          staffIds = await this.getActiveStaffIds(input.branchId);
        }

        if (!staffIds.length) {
          return {
            settings,
            staffIds: [],
            schedules: [],
            timeOff: [],
            appointments: [],
          };
        }

        const [schedules, timeOff, appointments] = await Promise.all([
          this.getSchedules(staffIds, normalizedDayOfWeeks),
          this.getTimeOff(staffIds, input.rangeStartUtc, input.rangeEndUtc),
          this.getAppointments(
            input.branchId,
            staffIds,
            input.rangeStartUtc,
            input.rangeEndUtc,
          ),
        ]);

        return {
          settings,
          staffIds,
          schedules,
          timeOff,
          appointments,
        };
      },
    );
  }
}
