/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AvailabilityService } from 'src/availability/availability.service';
import { eq, and } from 'drizzle-orm';
import * as client from 'src/db/client';
import {
  AvailabilityChainAssignment,
  AvailabilityChainPlan,
  AvailabilityChainRequestCore,
} from './availability-chain.types';
import { services, staff, staffServices } from 'src/db/schema';
import { DateTime } from 'luxon';

@Injectable()
export class AvailabilityChainCoreService {
  constructor(
    @Inject('DB') private db: client.DB,
    private readonly availabilityService: AvailabilityService,
  ) {}
  async getAvailableTimesChain(params: AvailabilityChainRequestCore) {
    const { branchId, date, chain } = params;

    if (!chain.length) {
      throw new BadRequestException('Chain is required');
    }

    // =====================
    // TIMEZONE CONSTANT (CHANGE HERE)
    // =====================
    const BRANCH_TZ = 'America/Mexico_City';

    // =====================
    // HELPERS
    // =====================

    const STEP_MIN = 15;

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

    const durationByService = new Map<string, number>();

    for (const step of chain) {
      if (durationByService.has(step.serviceId)) continue;

      const service = await client.db.query.services.findFirst({
        where: and(
          eq(services.id, step.serviceId),
          eq(services.branchId, branchId),
          eq(services.isActive, true),
        ),
      });

      if (!service?.durationMin) {
        throw new BadRequestException(
          `Invalid service in chain: ${step.serviceId}`,
        );
      }

      durationByService.set(step.serviceId, service.durationMin);
    }

    // =====================
    // 3️⃣ Cache: staff slots (availability)
    // =====================

    const staffSlotsCache = new Map<string, Set<string>>();

    const getStaffSlotSet = async (staffId: string): Promise<Set<string>> => {
      const cached = staffSlotsCache.get(staffId);
      if (cached) return cached;

      const availability = await this.availabilityService.getAvailability({
        branchId,
        staffId,
        date,
        requiredDurationMin: 0,
      });

      const staffRow = availability.staff.find((s) => s.staffId === staffId);
      const set = buildSlotSet(staffRow?.slots ?? []);

      staffSlotsCache.set(staffId, set);
      return set;
    };

    // =====================
    // 4️⃣ Cache: eligible staff for service (for ANY)
    // =====================

    const eligibleStaffByService = new Map<string, string[]>();

    const getEligibleStaffForService = async (
      serviceId: string,
    ): Promise<string[]> => {
      const cached = eligibleStaffByService.get(serviceId);
      if (cached) return cached;

      const rows = await client.db
        .select({
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
        .where(eq(staffServices.serviceId, serviceId));

      const list = rows.map((r) => r.staffId);

      eligibleStaffByService.set(serviceId, list);
      return list;
    };

    // =====================
    // 5️⃣ Build step candidates
    // =====================

    type StepCandidate = {
      serviceId: string;
      durationMin: number;
      candidates: string[]; // staffIds
    };

    const steps: StepCandidate[] = [];

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

      const eligibleStaff = await getEligibleStaffForService(step.serviceId);

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
        const slotSet = await getStaffSlotSet(staffId);
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

    const solveFrom = async (
      stepIndex: number,
      cursorIso: string,
    ): Promise<AvailabilityChainAssignment[] | null> => {
      if (stepIndex >= steps.length) return [];

      const memoKey = `${stepIndex}|${cursorIso}`;
      if (memoFail.has(memoKey)) return null;

      const step = steps[stepIndex];

      for (const staffId of step.candidates) {
        const slotSet = await getStaffSlotSet(staffId);

        const ok = canCoverDuration({
          slotSet,
          startIso: cursorIso,
          durationMin: step.durationMin,
        });

        if (!ok) continue;

        const endIso = addMinutesIso(cursorIso, step.durationMin);

        // 🔥 Opción C: redondear hacia arriba el inicio del siguiente servicio

        const nextCursorIso = ceilToStepIso(endIso, STEP_MIN);

        const next = await solveFrom(stepIndex + 1, nextCursorIso);

        if (next) {
          const current: AvailabilityChainAssignment = {
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

    const plans: AvailabilityChainPlan[] = [];

    for (const startIso of baseStartTimes) {
      const normalized = DateTime.fromISO(startIso, { zone: 'utc' })
        .toUTC()
        .toISO()!;

      const assignments = await solveFrom(0, normalized);

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
export type { AvailabilityChainPlan };
