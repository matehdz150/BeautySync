"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBranch } from "@/context/BranchContext";
import { getPublicPresence } from "@/lib/services/publicPresence";

import NoActivePublicPresence from "./NoActivePublicPresence";
import ActivePublicPresence from "./ActivePublicPresence";

export default function PublicPresencePage() {
  const { branch } = useBranch();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!branch) return;

    async function load() {
      try {
        const res = await getPublicPresence(branch.id);

        setEnabled(res.enabled);
        setSlug(res.slug);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [branch]);

  console.log(enabled,slug)

  // ⏳ Loader global
  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Cargando presencia pública…
        </p>
      </div>
    );
  }

  // ❌ Desactivada → onboarding
  if (!enabled) {
    return <NoActivePublicPresence />;
  }

  // ✅ Activa → panel de control
  return <ActivePublicPresence slug={slug!} />;
}