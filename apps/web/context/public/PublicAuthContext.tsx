"use client";

import { createContext, useContext, useEffect, useState } from "react";

type PublicUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

type PublicAuthContextValue = {
  user: PublicUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const PublicAuthContext = createContext<PublicAuthContextValue | null>(null);

export function PublicAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/public/auth/me`,
        { credentials: "include" }
      );
      const json = await res.json();
      setUser(json?.user ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <PublicAuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </PublicAuthContext.Provider>
  );
}

export function usePublicAuth() {
  const ctx = useContext(PublicAuthContext);
  if (!ctx) throw new Error("usePublicAuth must be used inside PublicAuthProvider");
  return ctx;
}