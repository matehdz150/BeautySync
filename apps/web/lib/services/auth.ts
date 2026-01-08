// lib/services/auth.ts
import { api } from "./api";

export async function login(email: string, password: string) {
  return api<{
    accessToken: string;
    user: {
      id: string;
      email: string;
      role: string;
      orgId?: string | null;
      needsOnboarding?: boolean;
    };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    credentials: "include",   // 👈 KEEP THIS
  });
}