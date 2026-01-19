"use client";

import { useMemo, useState } from "react";
import { usePublicBooking } from "@/context/PublicBookingContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/shared/Icon";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type CategoryTab = {
  id: string;
  name: string;
  icon?: string;
  hexColor?: string;
};

export default function PublicServicesPage() {
  const { branch, services: selectedServices, dispatch, catalog, loading, error } =
    usePublicBooking();

  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories: CategoryTab[] = useMemo(() => {
    const map = new Map<string, CategoryTab>();

    catalog.forEach((s) => {
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
    return catalog.filter((s) => s.category.id === activeCategory);
  }, [catalog, activeCategory]);

  function toggle(serviceId: string) {
    dispatch({ type: "TOGGLE_SERVICE", payload: serviceId });
  }

  if (!branch) return <div className="p-10">Sucursal no encontrada</div>;
  if (loading && catalog.length === 0) return <div className="p-10">Cargando servicios…</div>;
  if (error) return <div className="p-10 text-red-500">{error}</div>;

  return (
    <div className="space-y-8">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-60 h-125 w-255 -translate-x-1/2 z-0 rounded-full blur-3xl
             bg-gradient-to-b from-indigo-400/75 via-indigo-400/10 to-transparent"
        initial={{
          opacity: 0,
          scale: 0.92,
          filter: "blur(90px)",
        }}
        animate={{
          opacity: 1,
          scale: [1, 1.03, 1],
          y: [0, 10, 0],
          filter: ["blur(50px)", "blur(58px)", "blur(50px)"],
        }}
        transition={{
          opacity: { duration: 0.4, ease: "easeOut" },
          scale: { duration: 0.5, ease: "easeInOut", repeat: Infinity },
          y: { duration: 0.5, ease: "easeInOut", repeat: Infinity },
          filter: { duration: 0.5, ease: "easeInOut", repeat: Infinity },
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-10/12 top-120 h-125 w-255 -translate-x-1/2 z-0 rounded-full blur-3xl
             bg-gradient-to-b from-indigo-400/20 via-indigo-400/5 to-transparent"
        initial={{
          opacity: 0,
          scale: 0.92,
          filter: "blur(90px)",
        }}
        animate={{
          opacity: 1,
          scale: [1, 1.03, 1],
          y: [0, 10, 0],
          filter: ["blur(50px)", "blur(58px)", "blur(50px)"],
        }}
        transition={{
          opacity: { duration: 1.4, ease: "easeOut" },
          scale: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
          y: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
          filter: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
        }}
      />
      {/* HEADER */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border shrink-0 shadow-none px-5 py-5"
            tooltip="Volver"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex flex-col ">
            <h1 className="text-2xl font-semibold leading-tight">Selecciona tus servicios</h1>
          <p className="text-sm text-muted-foreground  max-w-md">
          Puedes elegir uno o varios servicios
        </p>
          </div>

        </div>

      </div>

      {/* CATEGORY NAV */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => {
          const active = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium border transition whitespace-nowrap flex items-center gap-2",
                active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50"
              )}
            >
              {cat.icon && <CategoryIcon name={cat.icon} className="w-4 h-4" />}
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* SERVICES LIST */}
      <div className="space-y-3">
        {filteredServices.map((service) => {
          const selected = selectedServices.includes(service.id);

          return (
            <button
              key={service.id}
              onClick={() => toggle(service.id)}
              className={cn(
                "w-full flex items-center justify-between rounded-xl border px-5 py-4 text-left transition cursor-pointer",
                selected ? "border-indigo-500 bg-indigo-50" : "hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-white border"
                >
                  <CategoryIcon name={service.category.icon} className="w-5 h-5 text-indigo-400" />
                </div>

                <div className="space-y-1">
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {service.durationMin} min ·{" "}
                    {service.priceCents ? `$${Math.round(service.priceCents / 100)} MXN` : "Gratis"}
                  </p>
                </div>
              </div>

              {selected && (
                <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}