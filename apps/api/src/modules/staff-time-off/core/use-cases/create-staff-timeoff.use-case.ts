import { Inject, Injectable } from '@nestjs/common';
import { StaffTimeOffRepository } from '../ports/staff-timeoff.repository.port';
import { StaffTimeOffRulesRepository } from '../ports/staff-timeoff-rules.repository.port';

import {
  STAFF_TIMEOFF_REPOSITORY,
  STAFF_TIMEOFF_RULES_REPOSITORY,
} from '../ports/tokens';

@Injectable()
export class CreateStaffTimeOffUseCase {
  constructor(
    @Inject(STAFF_TIMEOFF_REPOSITORY)
    private repo: StaffTimeOffRepository,

    @Inject(STAFF_TIMEOFF_RULES_REPOSITORY)
    private rulesRepo: StaffTimeOffRulesRepository,
  ) {}

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
        throw new Error('start and end are required');
      }

      if (start >= end) {
        throw new Error('Invalid time range');
      }

      return this.repo.create({
        branchId,
        staffId,
        start,
        end,
        reason,
      });
    }

    // =========================
    // CASE 2: RULE
    // =========================

    if (rule.recurrenceType === 'WEEKLY' && !rule.daysOfWeek?.length) {
      throw new Error('daysOfWeek required for weekly recurrence');
    }

    // 🔥 crear rule
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

    // =========================
    // OPCIONAL: materializar instancias
    // =========================
    // (esto es PRO, puedes quitarlo si quieres lazy evaluation)

    const instances: {
      branchId: string;
      staffId: string;
      start: Date;
      end: Date;
      reason?: string;
    }[] = [];

    const cursor = new Date(rule.startDate);
    const endDate = rule.endDate ?? new Date(cursor.getTime() + 30 * 86400000); // fallback 30 días

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

    if (instances.length) {
      await this.repo.createMany(instances);
    }

    return {
      rule: createdRule,
      instancesCreated: instances.length,
    };
  }
}
