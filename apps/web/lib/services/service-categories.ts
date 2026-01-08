import { api } from "./api";

/* ===== TYPES ===== */
export type ServiceCategory = {
  id: string;
  name: string;
  icon: string;
  colorHex: string;
  organizationId: string;
  createdAt: string;
};

/* ===== CATEGORIES ===== */

export async function getServiceCategories() {
  return api<ServiceCategory[]>("/service-categories", {
    method: "GET",
  });
}

export async function createServiceCategory(input: {
  name: string;
  icon: string;
  colorHex: string;
  organizationId: string;
}) {
  return api<ServiceCategory>("/service-categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateServiceCategory(
  id: string,
  input: {
    name?: string;
    icon?: string;
    colorHex?: string;
  }
) {
  return api<ServiceCategory>(`/service-categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteServiceCategory(id: string) {
  return api<{ ok: true }>(`/service-categories/${id}`, {
    method: "DELETE",
  });
}