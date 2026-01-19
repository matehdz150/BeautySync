// src/lib/services/publicPresence.ts
import { api } from "./api";

export type PublicPresenceStatus = {
  enabled: boolean;
  slug: string | null;
};


export async function getPublicPresence(
  branchId: string
): Promise<PublicPresenceStatus> {
  return api(`/public-presence/${branchId}`);
}

export async function enablePublicPresence(
  branchId: string
): Promise<PublicPresenceStatus> {
  return api(`/public-presence/${branchId}/activate`, {
    method: "PATCH",
  });
}

export async function disablePublicPresence(
  branchId: string
): Promise<PublicPresenceStatus> {
  return api(`/public-presence/${branchId}/deactivate`, {
    method: "PATCH",
  });
}

const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getPublicBranchBySlug(slug: string) {
  const res = await fetch(`${PUBLIC_API_URL}/branches/${slug}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Sucursal no encontrada");
  }

  return res.json();
}