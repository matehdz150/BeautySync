import { api } from "./api";

export async function login(email: string, password: string) {
  return api<{
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
  });
}