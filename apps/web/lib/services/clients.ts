// apps/web/lib/services/clients.ts

export type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  createdAt?: string;
};

import { api } from "./api";

export async function getClients(orgId: string) {
  return api<Client[]>(`/clients/organization/${orgId}`);
}

export async function createClient(input: { name: string; email?: string }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return api("/clients", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      organizationId: user.orgId,   // 👈 MÁNDALO
    }),
  });
}