import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { StaffTimeOffRepository } from '../ports/staff-timeoff.repository.port';
import { StaffTimeOffRulesRepository } from '../ports/staff-timeoff-rules.repository.port';

import {
  STAFF_TIMEOFF_REPOSITORY,
  STAFF_TIMEOFF_RULES_REPOSITORY,
} from '../ports/tokens';

import { CreateStaffTimeOffUseCase } from './create-staff-timeoff.use-case';
import { AvailabilityCacheService } from 'src/modules/availability/infrastructure/adapters/availability-cache.service';

@Injectable()
export class UpdateStaffTimeOffUseCase {
  constructor(
    @Inject(STAFF_TIMEOFF_REPOSITORY)
    private repo: StaffTimeOffRepository,

    @Inject(STAFF_TIMEOFF_RULES_REPOSITORY)
    private rulesRepo: StaffTimeOffRulesRepository,

    private readonly createUseCase: CreateStaffTimeOffUseCase,
    private readonly availabilityCache: AvailabilityCacheService,
  ) {}

  async execute(params: {
    id: number;
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
    const { id, start, end, reason, rule } = params;

    // 🔥 traer desde DB
    const existing = await this.repo.findById(id);

    if (!existing) {
      throw new NotFoundException('Time off not found');
    }

    const branchId = existing.branchId;
    const staffId = existing.staffId;

    // =========================
    // CASE 1: SINGLE
    // =========================
    if (!rule) {
      if (!start || !end) {
        throw new Error('START_AND_END_REQUIRED');
      }

      // 🔥 borrar actual
      await this.repo.delete(id);

      try {
        // 🔥 recrear con misma lógica que create
        const recreated = await this.createUseCase.execute({
          branchId,
          staffId,
          start,
          end,
          reason,
        });
        await this.availabilityCache.invalidate(branchId);
        return recreated;
      } catch (e) {
        // 🔥 rollback
        await this.repo.create({
          branchId: existing.branchId,
          staffId: existing.staffId,
          start: existing.start,
          end: existing.end,
          reason: existing.reason,
        });

        throw e;
      }
    }

    // =========================
    // CASE 2: RULE
    // =========================

    // 🔥 eliminar TODAS las instancias del staff en la sucursal
    const allTimeOffs = await this.repo.findForStaff(staffId);

    const toDelete = allTimeOffs.filter((t) => t.branchId === branchId);

    for (const t of toDelete) {
      await this.repo.delete(t.id);
    }

    // 🔥 eliminar TODAS las rules del staff
    const rules = await this.rulesRepo.findForStaff(staffId);

    for (const r of rules) {
      await this.rulesRepo.delete(r.id);
    }

    // 🔥 recrear con lógica completa de reglas
    const result = await this.createUseCase.execute({
      branchId,
      staffId,
      reason,
      rule,
    });
    await this.availabilityCache.invalidate(branchId);
    return result;
  }
}
