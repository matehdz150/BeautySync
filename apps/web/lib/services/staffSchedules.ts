// apps/web/lib/services/staffSchedules.ts
import { api } from "./api";
import { buildDedupKey, runDeduped, stableStringify } from "./request-dedupe";

const STAFF_SCHEDULE_CACHE_MS = 30_000;

export type StaffScheduleInput = {
  staffId: string;
  dayOfWeek: number;   // 0–6
  startTime: string;   // "09:00"
  endTime: string;     // "18:00"
};

export type StaffSchedule = {
  id: number;
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type StaffSchedulesByStaffResponse = {
  staffSchedules: Record<string, StaffSchedule[]>;
};

/* ===== CREATE ONE DAY SCHEDULE ===== */
export async function createStaffSchedule(input: StaffScheduleInput) {
  return api("/staff-schedules", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/* ===== BULK CREATE DEFAULT SCHEDULE ===== */
export async function saveDefaultScheduleForStaff(params: {
  staffId: string;
  days: number[];
  startTime: string;
  endTime: string;
}) {
  const { staffId, days, startTime, endTime } = params;

  // Podríamos paralelizar, pero lo dejo secuencial por claridad ⚠️
  for (const dayOfWeek of days) {
    await createStaffSchedule({
      staffId,
      dayOfWeek,
      startTime,
      endTime,
    });
  }
}

/* ===== GET STAFF SCHEDULE ===== */
export async function getScheduleForStaff(staffId: string) {
  const schedules = await getSchedulesForStaffMembers([staffId]);
  return schedules[staffId] ?? [];
}

export async function getSchedulesForStaffMembers(
  staffIds: string[],
): Promise<Record<string, StaffSchedule[]>> {
  const uniqueStaffIds = [...new Set(staffIds)].sort();

  if (uniqueStaffIds.length === 0) {
    return {};
  }

  return runDeduped(
    buildDedupKey(
      "GET",
      "/staff-schedules",
      stableStringify(uniqueStaffIds),
    ),
    async () => {
      const query = new URLSearchParams({
        staffIds: uniqueStaffIds.join(","),
      }).toString();
      const path = `/staff-schedules?${query}`;
      const response = await api<StaffSchedulesByStaffResponse>(path);

      return response.staffSchedules ?? {};
    },
    { cacheTtlMs: STAFF_SCHEDULE_CACHE_MS },
  );
}

export async function clearStaffSchedules(staffId: string) {
  return api<{ ok: true }>(`/staff-schedules/staff/${staffId}`, {
    method: "DELETE",
  });
}
