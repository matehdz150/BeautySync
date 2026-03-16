import { api } from "./api";

// ===============================
// TYPES
// ===============================

export interface StaffTimeOff {
  id: number;
  staffId: string;
  start: string;
  end: string;
  reason?: string;
}

export interface StaffTimeOffRule {
  id: number;
  staffId: string;
  recurrenceType: "NONE" | "DAILY" | "WEEKLY";
  daysOfWeek?: number[];
  startTime: string;
  endTime: string;
  startDate: string;
  endDate?: string;
  reason?: string;
}

// ===============================
// GET
// ===============================

export async function getStaffTimeOff(staffId: string) {
  return api<StaffTimeOff[]>(`/staff-time-off/staff/${staffId}`);
}

export async function getBranchTimeOff(branchId: string) {
  return api<StaffTimeOff[]>(`/staff-time-off/branch/${branchId}`);
}

// ===============================
// CREATE SINGLE
// ===============================

export async function createStaffTimeOff(data: {
  staffId: string;
  start: string;
  end: string;
  reason?: string;
}) {
  return api<StaffTimeOff>(`/staff-time-off`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ===============================
// CREATE RECURRING INSTANCES
// ===============================

export async function createRecurringStaffTimeOff(data: {
  staffId: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  startDate: string;
  endDate: string;
  reason?: string;
}) {
  return api(`/staff-time-off/recurring`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ===============================
// UPDATE INSTANCE
// ===============================

export async function updateStaffTimeOff(
  id: number,
  data: {
    start?: string;
    end?: string;
    reason?: string;
  }
) {
  return api(`/staff-time-off/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ===============================
// DELETE INSTANCE
// ===============================

export async function deleteStaffTimeOff(id: number) {
  return api(`/staff-time-off/${id}`, {
    method: "DELETE",
  });
}

// ===================================================
// RULES
// ===================================================

// ===============================
// CREATE RULE
// ===============================

export async function createStaffTimeOffRule(data: {
  staffId: string;
  recurrenceType: "NONE" | "DAILY" | "WEEKLY";
  daysOfWeek?: number[];
  startTime: string;
  endTime: string;
  startDate: string;
  endDate?: string;
  reason?: string;
}) {
  return api<StaffTimeOffRule>(`/staff-time-off/rules`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ===============================
// UPDATE RULE
// ===============================

export async function updateStaffTimeOffRule(
  id: number,
  data: Partial<{
    recurrenceType: "NONE" | "DAILY" | "WEEKLY";
    daysOfWeek?: number[];
    startTime?: string;
    endTime?: string;
    startDate?: string;
    endDate?: string;
    reason?: string;
  }>
) {
  return api<StaffTimeOffRule>(`/staff-time-off/rules/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ===============================
// DELETE RULE
// ===============================

export async function deleteStaffTimeOffRule(id: number) {
  return api(`/staff-time-off/rules/${id}`, {
    method: "DELETE",
  });
}