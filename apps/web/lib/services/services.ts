import { api } from "./api";

/* ===== TYPES ===== */

export type Service = {
  id: string;
  organizationId: string;
  branchId: string;
  categoryId?: string | null;
  name: string;
  description?: string | null;
  durationMin: number;
  priceCents?: number | null;
  isActive: boolean;
  createdAt: string;
};

/* ===== CREATE ===== */

export type CreateServiceInput = {
  organizationId: string;
  branchId: string;

  categoryId?: string | null;

  name: string;
  description?: string | null;

  durationMin: number;
  priceCents?: number | null;

  notes?: string[];
  serviceRules?: string[];

  isActive?: boolean;

  staffIds?: string[];   // opcional si luego haces otro endpoint
};

export async function createService(input: CreateServiceInput) {
  return api("/services", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      notes: input.notes ?? [],
      serviceRules: input.serviceRules ?? [],
      isActive: input.isActive ?? true,
      staffIds: input.staffIds ?? [],
    }),
  });
}

/* ===== LIST BY BRANCH ===== */

export async function getServicesByBranch(branchId: string) {
  return api<Service[]>(`/services/branch/${branchId}`, {
    method: "GET",
  });
}

/* ===== ASSIGN STAFF ===== */

export async function assignServiceToStaff(input: {
  staffId: string;
  serviceId: string;
}) {
  return api<{ ok: true }>("/services/assign", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/* ===== UNASSIGN STAFF ===== */

export async function unassignServiceFromStaff(input: {
  staffId: string;
  serviceId: string;
}) {
  return api<{ ok: true }>("/services/unassign", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/* ===== DELETE ===== */

export async function deleteService(id: string) {
  return api<{ ok: true }>(`/services/${id}`, {
    method: "DELETE",
  });
}

export async function getServiceById(id: string) {
  return api(`/services/${id}`, {
    method: "GET",
  });
}

export async function updateService(id: string, input: CreateServiceInput) {
  return api(`/services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}