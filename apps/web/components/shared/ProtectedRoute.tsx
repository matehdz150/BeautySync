"use client";

import { useAuth, type Role } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!allow.includes(user.role)) {
      router.replace("/no-access");
    }
  }, [loading, user, router, allow]);

  if (loading || !user) return null;

  if (!allow.includes(user.role)) return null;

  return <>{children}</>;
}