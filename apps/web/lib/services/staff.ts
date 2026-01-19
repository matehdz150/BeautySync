import { api } from "./api";

/* ===== TYPES ===== */

export type StaffService = {
  id: string;
  name: string;
  durationMin: number;
  priceCents?: number | null;

  category?: string | null;
  categoryColor?: string | null;
  categoryIcon?: string | null;
};

export type Staff = {
  id: string;
  name: string;
  email?: string | null;
  branchId: string;
  organizationId: string;
  invited?: boolean;
  services: StaffService[];
  jobRole?: string;
};

// lib/services/staff.ts

export type StaffScheduleDTO = {
  id: number;
  dayOfWeek: number;   // 0–6
  startTime: string;   // "09:00"
  endTime: string;     // "18:00"
};

export type StaffEditDTO = {
  id: string;
  name: string;
  email: string | null;
  phone?: string | null;
  jobRole?: string | null;
  avatarUrl?: string | null;

  permissionRole: "staff" | "manager";

  schedules: StaffScheduleDTO[];

  services: {
    serviceId: string;
  }[];
};

/* ===== CREATE STAFF (sin usuario aún) ===== */

export async function createStaff(input: {
  name: string;
  email: string;
  branchId: string;
  jobRole?: string;
  avatarUrl?: string | null;
}) {
  return api<Staff>("/staff", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/* ===== SEND INVITE TO STAFF ===== */

export async function inviteStaff(input: {
  email: string;
  staffId: string;
  role: "staff" | "manager";
}) {
  return api<{ ok: true }>("/staff/invite", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/* ===== GET STAFF IN A BRANCH ===== */

export async function getStaffByBranch(branchId: string) {
  return api<Staff[]>(`/staff/branch/${branchId}`);
}

export type StaffMember = {
  id: string;
  name: string;
  email?: string;
};

export async function getStaffForService(
  branchId: string,
  serviceId: string
) {
  const params = new URLSearchParams({
    branchId,
    serviceId,
  }).toString();

  return api<Staff[]>(`/staff/for-service?${params}`);
}

export async function getStaffById(staffId: string) {
  return api<StaffEditDTO>(`/staff/${staffId}`, {
    method: "GET",
  });
}

export async function updateStaff(
  staffId: string,
  input: {
    name?: string;
    email?: string;
    phone?: string;
    jobRole?: string;
    avatarUrl?: string | null;
  }
) {
  return api(`/staff/${staffId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}