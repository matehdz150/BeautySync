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
};

/* ===== CREATE STAFF (sin usuario aún) ===== */

export async function createStaff(input: {
  name: string;
  email: string;
  branchId: string;
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