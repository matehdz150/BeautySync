"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { login as loginApi } from "@/lib/services/auth";
import { useRouter } from "next/navigation";
import { useBranch } from "./BranchContext";
import { API_URL } from "@/lib/services/api";

export type Role = "owner" | "manager" | "staff";

export type User = {
  id: string;
  email: string;
  role: Role;
  orgId?: string | null;
  needsOnboarding?: boolean;
};

type AuthContext = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  updateUserOrg: (orgId: string) => void;
};

const Ctx = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setBranch } = useBranch();
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const parsed = JSON.parse(storedUser) as User;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(parsed);
    }

    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await loginApi(email, password);

    const typedUser: User = {
      ...res.user,
      role: res.user.role as Role,
    };

    setUser(typedUser);
    localStorage.setItem("user", JSON.stringify(typedUser));

    return typedUser;
  }

  function updateUserOrg(orgId: string) {
    setUser((prev) =>
      prev ? { ...prev, orgId, needsOnboarding: false } : prev
    );

    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored) as User;
      parsed.orgId = orgId;
      parsed.needsOnboarding = false;
      localStorage.setItem("user", JSON.stringify(parsed));
    }
  }

  function logout() {
    setUser(null);
    setBranch(null);
    localStorage.removeItem("user");

    // Opcional: endpoint backend para borrar cookie
    fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    router.replace("/login");
  }

  return (
    <Ctx.Provider
      value={{ user, loading, login, logout, updateUserOrg }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}