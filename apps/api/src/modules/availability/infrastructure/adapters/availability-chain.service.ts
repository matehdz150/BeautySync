/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { DateTime } from 'luxon';

import { AvailabilityService } from './availability.service';
import { GetSlotsForDayFromIndexUseCase } from '../../core/use-cases/get-slots-for-day-from-index.use-case';
import { SLOT_LOCK_PORT } from 'src/modules/cache/core/ports/tokens';
import { SlotLockPort } from 'src/modules/cache/core/ports/slot-lock.port';

@Injectable()
export class AvailabilityCoreService {
  constructor(
    private availabilityService: AvailabilityService,
    private readonly getSlotsForDayFromIndex: GetSlotsForDayFromIndexUseCase,
    @Inject(SLOT_LOCK_PORT)
    private readonly slotLock: SlotLockPort,
  ) {}

  async getAvailableTimes({
    branchId,
    serviceId,
    requiredDurationMin,
    date,
    staffId,
  }: {
    branchId: string;
    serviceId?: string;
    requiredDurationMin?: number;
    date: string;
    staffId?: string;
  }) {
    // 2️⃣ Validación de modo
    const isByService = typeof serviceId === 'string';
    const isByDuration = typeof requiredDurationMin === 'number';

    if (!isByService && !isByDuration) {
      throw new BadRequestException(
        'serviceId or requiredDurationMin is required',
      );
    }

    if (isByService && isByDuration) {
      throw new BadRequestException(
        'Use either serviceId OR requiredDurationMin, not both',
      );
    }

    // 3️⃣ Reusar motor único de disponibilidad
    const availability = await this.availabilityService.getAvailability({
      branchId,
      serviceId: isByService ? serviceId : undefined,
      requiredDurationMin: isByDuration ? requiredDurationMin : undefined,
      staffId,
      date,
    });

    // 4️⃣ Respuesta pública limpia
    return availability.staff.map((s) => ({
      staffId: s.staffId,
      slots: s.slots, // ISO UTC
    }));
  }

  async getAvailableTimesChain({
    branchId,
    date,
    chain,
  }: {
    branchId: string;
    date: string; // YYYY-MM-DD
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    chain: { serviceId: string; staffId: string | 'ANY' }[];
  }) {
    if (!chain.length) {
      throw new BadRequestException('Chain is required');
    }

    // =====================
    // TYPES (PLAN)
    // =====================

    type ChainAssignment = {
      serviceId: string;
      staffId: string;

      // UTC (source of truth)
      startIso: string;
      endIso: string;

      // Local timezone (for UI)
      startLocalIso: string;
      endLocalIso: string;

      durationMin: number;
    };

    type ChainPlan = {
      // UTC (source of truth)
      startIso: string;

      // Local timezone (for UI)
      startLocalIso: string;
      startLocalLabel: string; // "10:00"

      assignments: ChainAssignment[];
    };

    // =====================
    // HELPERS
    // =====================

    const STEP_MIN = 15;
    const index = await this.availabilityService.getAvailabilityIndex({
      branchId,
      date,
    });
    const settings = index.settings;
    const BRANCH_TZ = settings.timezone;

    function ceilToStepIso(isoUtc: string, stepMin = STEP_MIN) {
      const dt = DateTime.fromISO(isoUtc, { zone: 'utc' });

      const minutes = dt.minute;
      const remainder = minutes % stepMin;

      if (remainder === 0 && dt.second === 0 && dt.millisecond === 0) {
        return dt.toUTC().toISO()!;
      }

      const add = stepMin - remainder;

      return dt.plus({ minutes: add }).startOf('minute').toUTC().toISO()!;
    }

    function buildSlotSet(slots: string[]) {
      return new Set(slots);
    }

    function isSameLocalDay(dateStr: string) {
      // dateStr = "YYYY-MM-DD"
      const target = DateTime.fromISO(dateStr, { zone: BRANCH_TZ }).startOf(
        'day',
      );
      const nowLocal = DateTime.now().setZone(BRANCH_TZ).startOf('day');
      return target.toISODate() === nowLocal.toISODate();
    }

    function minStartForDateUtc({
      date,
      stepMin = STEP_MIN,
      noticeMin = 0,
    }: {
      date: string;
      stepMin?: number;
      noticeMin?: number;
    }) {
      // Si no es hoy, no hay restricción por "hora actual"
      if (!isSameLocalDay(date)) return null;

      // now en UTC + notice
      const minUtc = DateTime.now()
        .toUTC()
        .plus({ minutes: noticeMin })
        .startOf('minute')
        .toISO()!;

      // redondear hacia arriba a step (15m)
      return ceilToStepIso(minUtc, stepMin);
    }

    function addMinutesIso(isoUtc: string, minutes: number) {
      return DateTime.fromISO(isoUtc, { zone: 'utc' })
        .plus({ minutes })
        .toUTC()
        .toISO()!;
    }

    function toLocalIso(utcIso: string) {
      return DateTime.fromISO(utcIso, { zone: 'utc' })
        .setZone(BRANCH_TZ)
        .toISO()!;
    }

    function toLocalLabel(utcIso: string) {
      return DateTime.fromISO(utcIso, { zone: 'utc' })
        .setZone(BRANCH_TZ)
        .toFormat('HH:mm');
    }

    function canCoverDuration({
      slotSet,
      startIso,
      durationMin,
      stepMin = STEP_MIN,
    }: {
      slotSet: Set<string>;
      startIso: string;
      durationMin: number;
      stepMin?: number;
    }) {
      if (durationMin <= 0) return true;

      const neededSteps = Math.ceil(durationMin / stepMin);

      for (let i = 0; i < neededSteps; i++) {
        const t = addMinutesIso(startIso, i * stepMin);
        if (!slotSet.has(t)) return false;
      }

      return true;
    }

    // =====================
    // 2️⃣ Load durations for each service
    // =====================

    const uniqueServiceIds = [...new Set(chain.map((s) => s.serviceId))];
    const durationByService = new Map(
      uniqueServiceIds
        .map((serviceId) => {
          const durationMin = index.serviceDurations.get(serviceId);
          return typeof durationMin === 'number'
            ? ([serviceId, durationMin] as const)
            : null;
        })
        .filter(
          (entry): entry is readonly [string, number] => entry !== null,
        ),
    );

    for (const id of uniqueServiceIds) {
      if (!durationByService.has(id)) {
        throw new BadRequestException(`Invalid service in chain: ${id}`);
      }
    }

    const lockedByStaff = await this.slotLock.listLockedStarts({
      branchId,
      staffIds: [
        ...new Set((index.byDay.get(date)?.slots ?? []).map((slot) => slot.staffId)),
      ],
      date,
    });

    const availability = this.getSlotsForDayFromIndex.execute({
      index,
      date,
      branchId,
      settings,
      requiredDurationMin: 0,
      lockedStartsByStaff: lockedByStaff,
    });

    const staffSlotsById = new Map<string, Set<string>>();
    for (const s of availability.staff) {
      staffSlotsById.set(s.staffId, buildSlotSet(s.slots));
    }

    const EMPTY_SLOT_SET = new Set<string>();
    const getStaffSlotSet = (staffId: string): Set<string> =>
      staffSlotsById.get(staffId) ?? EMPTY_SLOT_SET;

    // =====================
    // 4️⃣ Eligible staff for service (for ANY) - batch
    // =====================

    const eligibleStaffByService = index.staffIdsByService;

    // =====================
    // 5️⃣ Build step candidates
    // =====================

    type StepCandidate = {
      serviceId: string;
      durationMin: number;
      candidates: string[]; // staffIds
    };

    const steps: StepCandidate[] = [];

    const fixedStaffIds = [
      ...new Set(
        chain.map((s) => s.staffId).filter((id): id is string => id !== 'ANY'),
      ),
    ];

    if (fixedStaffIds.length) {
      const activeStaffIds = new Set(index.activeStaffIds);
      for (const id of fixedStaffIds) {
        if (!activeStaffIds.has(id)) {
          throw new BadRequestException(`Staff not available: ${id}`);
        }
      }
    }

    for (const step of chain) {
      const durationMin = durationByService.get(step.serviceId)!;

      if (step.staffId !== 'ANY') {
        steps.push({
          serviceId: step.serviceId,
          durationMin,
          candidates: [step.staffId],
        });

        continue;
      }

      const eligibleStaff = eligibleStaffByService.get(step.serviceId) ?? [];

      steps.push({
        serviceId: step.serviceId,
        durationMin,
        candidates: eligibleStaff,
      });
    }

    if (steps.some((s) => s.candidates.length === 0)) {
      return [];
    }

    // =====================
    // 6️⃣ BaseStartTimes (union from step 0 candidates)
    // =====================

    const baseStartTimes = new Set<string>();

    {
      const first = steps[0];

      for (const staffId of first.candidates) {
        const slotSet = getStaffSlotSet(staffId);
        for (const slotIso of slotSet) {
          baseStartTimes.add(slotIso);
        }
      }
    }

    if (!baseStartTimes.size) return [];

    const minBookingNoticeMin = 0;

    const minStartUtc = minStartForDateUtc({
      date,
      stepMin: STEP_MIN,
      noticeMin: minBookingNoticeMin,
    });

    if (minStartUtc) {
      for (const slotIso of Array.from(baseStartTimes)) {
        // slotIso está en UTC ISO
        if (slotIso < minStartUtc) {
          baseStartTimes.delete(slotIso);
        }
      }
    }

    if (!baseStartTimes.size) return [];

    // =====================
    // 7️⃣ Backtracking solver that RETURNS assignments
    // =====================

    const memoFail = new Set<string>();

    const solveFrom = (
      stepIndex: number,
      cursorIso: string,
    ): ChainAssignment[] | null => {
      if (stepIndex >= steps.length) return [];

      const memoKey = `${stepIndex}|${cursorIso}`;
      if (memoFail.has(memoKey)) return null;

      const step = steps[stepIndex];

      for (const staffId of step.candidates) {
        const slotSet = getStaffSlotSet(staffId);

        const ok = canCoverDuration({
          slotSet,
          startIso: cursorIso,
          durationMin: step.durationMin,
        });

        if (!ok) continue;

        const endIso = addMinutesIso(cursorIso, step.durationMin);

        // 🔥 Opción C: redondear hacia arriba el inicio del siguiente servicio
        const nextCursorIso = ceilToStepIso(endIso, STEP_MIN);

        const next = solveFrom(stepIndex + 1, nextCursorIso);

        if (next) {
          const current: ChainAssignment = {
            serviceId: step.serviceId,
            staffId,

            startIso: cursorIso,
            endIso,

            startLocalIso: toLocalIso(cursorIso),
            endLocalIso: toLocalIso(endIso),

            durationMin: step.durationMin,
          };

          return [current, ...next];
        }
      }

      memoFail.add(memoKey);
      return null;
    };

    // =====================
    // 8️⃣ Evaluate all startIso -> build plans
    // =====================

    const plans: ChainPlan[] = [];

    for (const startIso of baseStartTimes) {
      const normalized = DateTime.fromISO(startIso, { zone: 'utc' })
        .toUTC()
        .toISO()!;

      const assignments = solveFrom(0, normalized);

      if (assignments?.length) {
        plans.push({
          startIso: normalized,
          startLocalIso: toLocalIso(normalized),
          startLocalLabel: toLocalLabel(normalized),
          assignments,
        });
      }
    }

    plans.sort((a, b) => a.startIso.localeCompare(b.startIso));

    return plans;
  }
}
