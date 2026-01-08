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