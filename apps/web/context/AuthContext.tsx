"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { login as loginApi } from "@/lib/services/auth";
import { useRouter } from "next/navigation";
import { useBranch } from "./BranchContext";

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
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  updateUserOrg: (orgId: string) => void;
};

const Ctx = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { setBranch } = useBranch();

  const router = useRouter();

  useEffect(() => {
    function restore() {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("accessToken");

      if (storedUser && storedToken) {
        const parsed = JSON.parse(storedUser) as User;

        setUser({
          ...parsed,
          role: parsed.role as Role,
        });

        setToken(storedToken);
      }

      setLoading(false);
    }

    restore();
  }, []);

  async function login(email: string, password: string) {
    const res = await loginApi(email, password);

    const typedUser: User = {
      ...res.user,
      role: res.user.role as Role,
    };

    setUser(typedUser);
    setToken(res.accessToken);

    localStorage.setItem("accessToken", res.accessToken);
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
    setToken(null);
    setBranch(null);

    // Borra solo lo necesario (mejor práctica)
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    // Si usas algo más, bórralo aquí

    router.replace("/login");
  }

  return (
    <Ctx.Provider
      value={{ user, token, loading, login, logout, updateUserOrg }}
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
