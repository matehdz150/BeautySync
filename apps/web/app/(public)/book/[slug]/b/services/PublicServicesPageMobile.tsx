"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";

import { usePublicBooking } from "@/context/PublicBookingContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/shared/Icon";

type CategoryTab = {
  id: string;
  name: string;
  icon?: string;
  hexColor?: string;
};

function formatMoneyMXN(cents: number | null) {
  if (!cents || cents <= 0) return "Gratis";
  return `$${Math.round(cents / 100)} MXN`;
}

export default function PublicServicesMobilePage() {
  const { branch, services: selectedServices, dispatch, catalog, loading, error } =
    usePublicBooking();

  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories: CategoryTab[] = useMemo(() => {
    const map = new Map<string, CategoryTab>();

    catalog.forEach((s) => {
      if (!s.category?.id) return;

      if (!map.has(s.category.id)) {
        map.set(s.category.id, {
          id: s.category.id,
          name: s.category.name,
          icon: s.category.icon,
          hexColor: s.category.hexColor,
        });
      }
    });

    return [{ id: "all", name: "Todos" }, ...Array.from(map.values())];
  }, [catalog]);

  const filteredServices = useMemo(() => {
    if (activeCategory === "all") return catalog;
    return catalog.filter((s) => s.category?.id === activeCategory);
  }, [catalog, activeCategory]);

  const selectedCount = selectedServices.length;

  const totalSelectedCents = useMemo(() => {
    return catalog
      .filter((s) => selectedServices.includes(s.id))
      .reduce((acc, s) => acc + (s.priceCents ?? 0), 0);
  }, [catalog, selectedServices]);

  function toggle(serviceId: string) {
    dispatch({ type: "TOGGLE_SERVICE", payload: serviceId });
  }

  if (!branch) return <div className="p-6">Sucursal no encontrada</div>;
  if (loading && catalog.length === 0) return <div className="p-6">Cargando servicios…</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="min-h-dvh bg-white relative overflow-hidden">
      {/* glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-40 h-96 w-[520px] -translate-x-1/2 rounded-full blur-3xl
        bg-gradient-to-b from-indigo-400/45 via-indigo-400/15 to-transparent"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: [1, 1.02, 1], y: [0, 10, 0] }}
        transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity }}
      />

      {/* =========================
          HEADER STICKY
      ========================= */}
      <div className="sticky top-0 z-40 bg-white/92 backdrop-blur-md border-b border-black/5">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-black/10 shadow-none shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-tight truncate">
              Selecciona tus servicios
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              Puedes elegir uno o varios servicios
            </p>
          </div>
        </div>

        {/* =========================
            CATEGORY TABS STICKY
        ========================= */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const active = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition flex items-center gap-2",
                    active
                      ? "bg-black text-white border-black"
                      : "bg-white border-black/10 hover:bg-black/5"
                  )}
                >
                  {cat.icon && (
                    <CategoryIcon
                      name={cat.icon}
                      className={cn("w-4 h-4", active ? "text-white" : "text-indigo-400")}
                    />
                  )}
                  <span className="whitespace-nowrap">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================
          LIST
      ========================= */}
      <div className="px-4 pt-4 pb-32 space-y-3">
        {filteredServices.map((service) => {
          const selected = selectedServices.includes(service.id);

          return (
            <button
              key={service.id}
              onClick={() => toggle(service.id)}
              className={cn(
                "w-full rounded-2xl border px-4 py-4 text-left transition active:scale-[0.99]",
                selected
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-black/10 bg-white hover:bg-black/[0.02]"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                {/* left */}
                <div className="min-w-0 flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl border border-black/10 bg-white flex items-center justify-center shrink-0">
                    <CategoryIcon
                      name={service.category?.icon}
                      className="w-5 h-5 text-indigo-400"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-base font-semibold truncate">
                      {service.name}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {service.durationMin} min · {formatMoneyMXN(service.priceCents)}
                    </p>
                  </div>
                </div>

                {/* right */}
                <div className="shrink-0">
                  {selected ? (
                    <div className="h-7 w-7 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                      <Check className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-full border border-black/10 bg-white" />
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {filteredServices.length === 0 && (
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <p className="text-sm font-medium">No hay servicios aquí</p>
            <p className="text-xs text-muted-foreground mt-1">
              Prueba otra categoría.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}