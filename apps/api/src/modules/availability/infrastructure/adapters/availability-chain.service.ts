import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { DateTime } from 'luxon';

import { AvailabilityService } from './availability.service';
import { SLOT_LOCK_PORT } from 'src/modules/cache/core/ports/tokens';
import { SlotLockPort } from 'src/modules/cache/core/ports/slot-lock.port';
import { AvailabilitySnapshotService } from './availability-snapshot.service';

@Injectable()
export class AvailabilityCoreService {
  constructor(
    private availabilityService: AvailabilityService,
    private readonly availabilitySnapshot: AvailabilitySnapshotService,
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

    const snapshot = await this.availabilitySnapshot.getDaySnapshot({
      branchId,
      date,
    });
    const STEP_MIN = snapshot.stepMin || 15;
    const STEP_MS = STEP_MIN * 60_000;
    const BRANCH_TZ = snapshot.timezone;

    if (!snapshot.staff.length) {
      return [];
    }

    function ceilToStepMs(startMs: number, stepMs = STEP_MS) {
      const remainder = startMs % stepMs;
      if (remainder === 0) {
        return startMs;
      }

      return startMs + (stepMs - remainder);
    }

    function addMinutesMs(startMs: number, minutes: number) {
      return startMs + minutes * 60_000;
    }

    function toUtcIso(utcMs: number) {
      return new Date(utcMs).toISOString();
    }

    function toLocalIso(utcMs: number) {
      return DateTime.fromMillis(utcMs, { zone: 'utc' })
        .setZone(BRANCH_TZ)
        .toISO()!;
    }

    function toLocalLabel(utcMs: number) {
      return DateTime.fromMillis(utcMs, { zone: 'utc' })
        .setZone(BRANCH_TZ)
        .toFormat('HH:mm');
    }

    function canCoverDuration({
      slotSet,
      startMs,
      durationMin,
      stepMin = STEP_MIN,
    }: {
      slotSet: Set<number>;
      startMs: number;
      durationMin: number;
      stepMin?: number;
    }) {
      if (durationMin <= 0) return true;

      const neededSteps = Math.ceil(durationMin / stepMin);

      for (let i = 0; i < neededSteps; i++) {
        const t = addMinutesMs(startMs, i * stepMin);
        if (!slotSet.has(t)) return false;
      }

      return true;
    }

    // =====================
    // 2️⃣ Load durations for each service
    // =====================

    const uniqueServiceIds = [...new Set(chain.map((s) => s.serviceId))];
    const servicesById = new Map(
      snapshot.services.map((service) => [
        service.id,
        {
          durationMin: service.durationMin,
          availableStaffIdsByStart: new Map(service.availableStaffIdsByStart),
        },
      ]),
    );
    const durationByService = new Map(
      uniqueServiceIds
        .map((serviceId) => {
          const service = servicesById.get(serviceId);
          return service ? ([serviceId, service.durationMin] as const) : null;
        })
        .filter((entry): entry is readonly [string, number] => entry !== null),
    );

    for (const id of uniqueServiceIds) {
      if (!durationByService.has(id)) {
        throw new BadRequestException(`Invalid service in chain: ${id}`);
      }
    }

    // =====================
    // 4️⃣ Eligible staff for service (for ANY) - batch
    // =====================

    const eligibleStaffByService = new Map(
      snapshot.services.map((service) => [
        service.id,
        [
          ...new Set(
            service.availableStaffIdsByStart.flatMap(
              ([, staffIds]) => staffIds,
            ),
          ),
        ],
      ]),
    );

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
    const activeStaffIds = new Set(snapshot.staff.map((staff) => staff.id));
    const startsByStaff = new Map(snapshot.startsByStaff ?? []);
    const dayStaffIds = new Set(startsByStaff.keys());

    if (fixedStaffIds.length) {
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

      const eligibleStaff = (
        eligibleStaffByService.get(step.serviceId) ?? []
      ).filter((candidateStaffId) => dayStaffIds.has(candidateStaffId));

      steps.push({
        serviceId: step.serviceId,
        durationMin,
        candidates: eligibleStaff,
      });
    }

    if (steps.some((s) => s.candidates.length === 0)) {
      return [];
    }

    const candidateStaffIds = [
      ...new Set(steps.flatMap((step) => step.candidates)),
    ].filter((candidateStaffId) => startsByStaff.has(candidateStaffId));

    if (!candidateStaffIds.length) {
      return [];
    }

    const lockedByStaff = await this.slotLock.listLockedStarts({
      branchId,
      staffIds: candidateStaffIds,
      date,
    });

    const EMPTY_SLOT_LIST: number[] = [];
    const EMPTY_SLOT_SET = new Set<number>();
    const staffStartsMsById = new Map<string, number[]>();
    const staffStartSetById = new Map<string, Set<number>>();

    for (const staffId of candidateStaffIds) {
      const starts = startsByStaff.get(staffId) ?? EMPTY_SLOT_LIST;
      if (!starts.length) {
        continue;
      }

      const locked = lockedByStaff.get(staffId) ?? new Set<string>();
      const lockedStartsMs = new Set<number>(
        [...locked].map((lockedStartIso) => Date.parse(lockedStartIso)),
      );
      const availableStarts: number[] = [];
      const availableStartSet = new Set<number>();

      for (const startMs of starts) {
        if (lockedStartsMs.has(startMs)) {
          continue;
        }

        availableStarts.push(startMs);
        availableStartSet.add(startMs);
      }

      if (!availableStarts.length) {
        continue;
      }

      staffStartsMsById.set(staffId, availableStarts);
      staffStartSetById.set(staffId, availableStartSet);
    }

    const getStaffStartSet = (staffId: string): Set<number> =>
      staffStartSetById.get(staffId) ?? EMPTY_SLOT_SET;

    // =====================
    // 6️⃣ BaseStartTimes (union from step 0 candidates)
    // =====================

    const baseStartTimes = new Set<number>();

    {
      const first = steps[0];

      for (const staffId of first.candidates) {
        const starts = staffStartsMsById.get(staffId) ?? EMPTY_SLOT_LIST;
        for (const startMs of starts) {
          baseStartTimes.add(startMs);
        }
      }
    }

    if (!baseStartTimes.size) return [];

    if (!baseStartTimes.size) return [];

    // =====================
    // 7️⃣ Backtracking solver that RETURNS assignments
    // =====================

    const memoFail = new Set<string>();

    const solveFrom = (
      stepIndex: number,
      cursorMs: number,
    ): ChainAssignment[] | null => {
      if (stepIndex >= steps.length) return [];

      const memoKey = `${stepIndex}|${cursorMs}`;
      if (memoFail.has(memoKey)) return null;

      const step = steps[stepIndex];

      for (const staffId of step.candidates) {
        const slotSet = getStaffStartSet(staffId);

        const ok = canCoverDuration({
          slotSet,
          startMs: cursorMs,
          durationMin: step.durationMin,
        });

        if (!ok) continue;

        const endMs = addMinutesMs(cursorMs, step.durationMin);

        // 🔥 Opción C: redondear hacia arriba el inicio del siguiente servicio
        const nextCursorMs = ceilToStepMs(endMs, STEP_MS);

        const next = solveFrom(stepIndex + 1, nextCursorMs);

        if (next) {
          const startIso = toUtcIso(cursorMs);
          const endIso = toUtcIso(endMs);
          const current: ChainAssignment = {
            serviceId: step.serviceId,
            staffId,

            startIso,
            endIso,

            startLocalIso: toLocalIso(cursorMs),
            endLocalIso: toLocalIso(endMs),

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

    const sortedBaseStarts = [...baseStartTimes].sort((a, b) => a - b);

    for (const startMs of sortedBaseStarts) {
      const assignments = solveFrom(0, startMs);

      if (assignments?.length) {
        const normalized = toUtcIso(startMs);
        plans.push({
          startIso: normalized,
          startLocalIso: toLocalIso(startMs),
          startLocalLabel: toLocalLabel(startMs),
          assignments,
        });
      }
    }

    plans.sort((a, b) => a.startIso.localeCompare(b.startIso));

    return plans;
  }
}
