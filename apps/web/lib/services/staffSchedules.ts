// apps/web/lib/services/staffSchedules.ts
import { api } from "./api";

export type StaffScheduleInput = {
  staffId: string;
  dayOfWeek: number;   // 0–6
  startTime: string;   // "09:00"
  endTime: string;     // "18:00"
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
  return api(`/staff-schedules/staff/${staffId}`);
}