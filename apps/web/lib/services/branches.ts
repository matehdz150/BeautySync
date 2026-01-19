import { api } from "./api";

export type Branch = {
  id: string;
  name: string;
  address?: string | null;
  organizationId: string;
};

export async function fetchBranchesByOrg(orgId: string) {
  try {
    return await api<Branch[]>(`/branches/organization/${orgId}`);
  } catch (err) {
    console.error("❌ Error fetching branches for org:", orgId, err);
    throw err;
  }
}

export type UpdateBranchLocationDto = {
  lat: number;
  lng: number;
  address?: string; // opcional si lo quieres guardar también
};

export async function updateBranchLocation(
  branchId: string,
  dto: UpdateBranchLocationDto
) {
  return api(`/branches/${branchId}/location`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export type UpdateBranchDto = {
  name?: string;
  address?: string;
  description?: string;
};

export async function updateBranch(branchId: string, dto: UpdateBranchDto) {
  return api(`/branches/${branchId}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export type BranchBasicResponse = {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
};

export async function getBranchBasic(branchId: string) {
  return api<BranchBasicResponse>(`/branches/${branchId}/basic`, {
    method: "GET",
  });
}