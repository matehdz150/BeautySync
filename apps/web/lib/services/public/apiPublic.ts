import { API_URL } from "@/lib/services/api";
import { PublicApiError } from "@/lib/errors";

/* =====================
   TYPES
===================== */

export type PublicService = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number | null;
  category: {
    id: string;
    name: string;
    icon: string;
    hexColor: string;
  };
};

export type PublicStaff = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type AvailableDate = {
  date: string; // YYYY-MM-DD
};

export type AvailableTime = {
  staffId: string;
  slots: string[]; // ISO UTC
};

/* =====================
   INTERNAL HELPER
   (public fetch, no auth)
===================== */


export async function publicFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("Falta NEXT_PUBLIC_API_URL");

  const res = await fetch(`${base}${path}`, {
    ...init,
    credentials: "include", // 🔥 importante para cookies pubsid
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    // 1) Missing session / invalid session
    if (res.status === 401) {
      throw new PublicApiError({
        code: "UNAUTHORIZED",
        status: 401,
        message: json?.message ?? "No autorizado",
      });
    }

    // 2) Phone required
    if (res.status === 403 && json?.code === "PHONE_REQUIRED") {
      throw new PublicApiError({
        code: "PHONE_REQUIRED",
        status: 403,
        message: json?.message ?? "Teléfono requerido",
      });
    }

    throw new PublicApiError({
      code: "UNKNOWN",
      status: res.status,
      message: json?.message ?? "Error inesperado",
    });
  }

  return json as T;
}