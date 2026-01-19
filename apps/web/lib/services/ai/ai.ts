import { api } from "../api";

export async function generateBranchDescription(branchId: string) {
  return api(`/ia/branches/${branchId}/description`, {
    method: "POST",
  });
}