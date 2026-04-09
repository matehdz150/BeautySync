import { Inject, Injectable } from '@nestjs/common';
import { StaffTimeOffRepository } from '../ports/staff-timeoff.repository.port';
import { StaffTimeOffRulesRepository } from '../ports/staff-timeoff-rules.repository.port';

import {
  STAFF_TIMEOFF_REPOSITORY,
  STAFF_TIMEOFF_RULES_REPOSITORY,
} from '../ports/tokens';

import { GetAvailableTimeOffStartSlotsUseCase } from './availability/get-available-timeoff-slots.use-case';
import { GetAvailableTimeOffEndSlotsUseCase } from './availability/get-available-timeoff-end.use-case';
import { DateTime } from 'luxon';
import { AvailabilityCacheService } from 'src/modules/availability/infrastructure/adapters/availability-cache.service';
import { AvailabilitySnapshotWarmService } from 'src/modules/availability/infrastructure/adapters/availability-snapshot-warm.service';

@Injectable()
export class CreateStaffTimeOffUseCase {
  constructor(
    @Inject(STAFF_TIMEOFF_REPOSITORY)
    private repo: StaffTimeOffRepository,

    @Inject(STAFF_TIMEOFF_RULES_REPOSITORY)
    private rulesRepo: StaffTimeOffRulesRepository,

    private readonly getAvailableStartSlots: GetAvailableTimeOffStartSlotsUseCase,
    private readonly getAvailableEndSlots: GetAvailableTimeOffEndSlotsUseCase,
    private readonly availabilityCache: AvailabilityCacheService,
    private readonly availabilityWarm: AvailabilitySnapshotWarmService,
  ) {}

  private async assertTimeOffIsAvailable(params: {
    branchId: string;
    staffId: string;
    start: Date;
    end: Date;
  }) {
    const { branchId, staffId, start, end } = params;

    if (start >= end) {
      throw new Error('INVALID_RANGE');
    }

    const startDt = DateTime.fromJSDate(start).setZone('utc');
    const endDt = DateTime.fromJSDate(end).setZone('utc');

    const date = startDt.setZone('America/Mexico_City').toISODate();
    const startISO = startDt.toISO();
    const endISO = endDt.toISO();

    if (!date || !startISO || !endISO) {
      throw new Error('INVALID_DATETIME');
    }

    // 1. validar start disponible
    const startSlots = await this.getAvailableStartSlots.execute({
      branchId,
      staffId,
      date,
    });

    const hasStart = startSlots.slots.includes(startISO);

    if (!hasStart) {
      throw new Error('TIMEOFF_START_NOT_AVAILABLE');
    }

    // 2. validar end permitido para ese start
    const endSlots = await this.getAvailableEndSlots.execute({
      branchId,
      staffId,
      date,
      startISO,
    });

    const hasEnd = endSlots.endSlots.includes(endISO);

    if (!hasEnd) {
      throw new Error('TIMEOFF_END_NOT_AVAILABLE');
    }
  }

  async execute(params: {
    branchId: string;
    staffId: string;
    start?: Date;
    end?: Date;
    reason?: string;
    rule?: {
      recurrenceType: 'NONE' | 'DAILY' | 'WEEKLY';
      daysOfWeek?: number[];
      startTime: string;
      endTime: string;
      startDate: Date;
      endDate?: Date;
    };
  }) {
    const { staffId, start, end, reason, rule, branchId } = params;

    // =========================
    // CASE 1: SIMPLE TIME OFF
    // =========================
    if (!rule) {
      if (!start || !end) {
        throw new Error('START_AND_END_REQUIRED');
      }

      await this.assertTimeOffIsAvailable({
        branchId,
        staffId,
        start,
        end,
      });

      const created = await this.repo.create({
        branchId,
        staffId,
        start,
        end,
        reason,
      });

      const date = DateTime.fromJSDate(start)
        .setZone('America/Mexico_City')
        .toISODate();
      if (date) {
        await this.availabilityCache.invalidate(branchId, date);
        await this.availabilityWarm.enqueueWindowForDate({ branchId, date });
      } else {
        await this.availabilityCache.invalidate(branchId);
      }
      return created;
    }

    // =========================
    // CASE 2: RULE
    // =========================
    if (rule.recurrenceType === 'WEEKLY' && !rule.daysOfWeek?.length) {
      throw new Error('NO_DAYS_SELECTED');
    }

    // crear regla
    const createdRule = await this.rulesRepo.create({
      staffId,
      recurrenceType: rule.recurrenceType,
      daysOfWeek: rule.daysOfWeek,
      startTime: rule.startTime,
      endTime: rule.endTime,
      startDate: rule.startDate,
      endDate: rule.endDate,
      reason,
    });

    // materializar instancias
    const instances: {
      branchId: string;
      staffId: string;
      start: Date;
      end: Date;
      reason?: string;
    }[] = [];

    const cursor = new Date(rule.startDate);
    const endDate = rule.endDate ?? new Date(cursor.getTime() + 30 * 86400000);

    while (cursor <= endDate) {
      const day = cursor.getDay(); // 0-6
      let shouldApply = false;

      if (rule.recurrenceType === 'DAILY') {
        shouldApply = true;
      }

      if (rule.recurrenceType === 'WEEKLY' && rule.daysOfWeek?.includes(day)) {
        shouldApply = true;
      }

      if (shouldApply) {
        const dateStr = cursor.toISOString().split('T')[0];

        const start = new Date(`${dateStr}T${rule.startTime}`);
        const end = new Date(`${dateStr}T${rule.endTime}`);

        instances.push({
          branchId,
          staffId,
          start,
          end,
          reason,
        });
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    // 🔥 validar TODAS antes de crear
    for (const instance of instances) {
      await this.assertTimeOffIsAvailable({
        branchId: instance.branchId,
        staffId: instance.staffId,
        start: instance.start,
        end: instance.end,
      });
    }

    const createdInstances =
      instances.length > 0 ? await this.repo.createMany(instances) : [];

    await this.availabilityWarm.enqueueRange({
      branchId,
      start: DateTime.fromJSDate(rule.startDate).toISODate() as string,
      end: DateTime.fromJSDate(
        rule.endDate ?? new Date(rule.startDate.getTime() + 30 * 86400000),
      ).toISODate() as string,
    });
    await this.availabilityCache.invalidate(branchId);

    return {
      rule: createdRule,
      instancesCreated: instances.length,
      instances: createdInstances,
    };
  }
}
