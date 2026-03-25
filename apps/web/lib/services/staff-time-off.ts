import { api } from "./api";

// ===============================
// TYPES
// ===============================

export type RecurrenceType = "NONE" | "DAILY" | "WEEKLY";

export interface StaffTimeOff {
  id: number;
  staffId: string;
  branchId: string;
  start: string;
  end: string;
  reason?: string;
}

export interface StaffTimeOffRule {
  id: number;
  staffId: string;
  recurrenceType: RecurrenceType;
  daysOfWeek?: number[];
  startTime: string;
  endTime: string;
  startDate: string;
  endDate?: string;
  reason?: string;
  createdAt?: string;
}

export interface CreateStaffTimeOffRuleInput {
  recurrenceType: RecurrenceType;
  daysOfWeek?: number[];
  startTime: string;
  endTime: string;
  startDate: string;
  endDate?: string;
}

export interface CreateStaffTimeOffInput {
  staffId: string;
  branchId: string;

  // simple time off
  start?: string;
  end?: string;

  // recurring rule
  rule?: CreateStaffTimeOffRuleInput;

  reason?: string;
}

export type CreateStaffTimeOffResponse =
  | StaffTimeOff
  | {
      rule: StaffTimeOffRule;
      instancesCreated: number;
    };

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

export async function createStaffTimeOff(data: CreateStaffTimeOffInput) {
  return api<CreateStaffTimeOffResponse>(`/staff-time-off`, {
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
  },
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
  }>,
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


// ===============================
// GET ONE TIME OFF DETAIL
// ===============================

export interface StaffTimeOffDetail {
  timeOff: StaffTimeOff;
  rules: StaffTimeOffRule[];
}

export async function getStaffTimeOffDetail(params: {
  staffId: string;
  branchId: string;
  timeOffId: number;
}) {
  const { staffId, branchId, timeOffId } = params;

  return api<StaffTimeOffDetail>(
    `/staff-time-off/${staffId}/${branchId}/${timeOffId}`
  );
}

// ===============================
// TIME OFF AVAILABILITY
// ===============================

export interface TimeOffStartSlotsResponse {
  slots: string[]; // ISO UTC
}

export interface TimeOffEndSlotsResponse {
  endSlots: string[]; // ISO UTC
}

// ===============================
// GET AVAILABLE START SLOTS
// ===============================

export async function getTimeOffStartSlots(params: {
  branchId: string;
  staffId: string;
  date: string;
}) {
  const { branchId, staffId, date } = params;

  const query = new URLSearchParams({
    branchId,
    staffId,
    date,
  }).toString();

  return api<TimeOffStartSlotsResponse>(
    `/staff-time-off/availability/start?${query}`
  );
}

// ===============================
// GET AVAILABLE END SLOTS
// ===============================

export async function getTimeOffEndSlots(params: {
  branchId: string;
  staffId: string;
  date: string;
  startISO: string;
}) {
  const { branchId, staffId, date, startISO } = params;

  const query = new URLSearchParams({
    branchId,
    staffId,
    date,
    startISO,
  }).toString();

  return api<TimeOffEndSlotsResponse>(
    `/staff-time-off/availability/end?${query}`
  );
}