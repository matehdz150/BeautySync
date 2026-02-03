"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

import { useSlotBooking } from "@/context/SlotBookingContext";
import { getAvailableServicesForSlot } from "@/lib/services/availability";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/shared/Icon";
import { Skeleton } from "@/components/ui/skeleton";

type AvailableService = {
  id: string;
  name: string;
  durationMin: number;
  priceCents?: number | null;
  category?: {
    colorHex?: string | null;
    icon?: string | null;
  } | null;
};

export function StepPickFirstService() {
  const { state, actions } = useSlotBooking();
  const { branchId, pinnedStaffId, pinnedStartIso } = state;

  const [services, setServices] = useState<AvailableService[]>([]);
  const [loading, setLoading] = useState(false);

  // ============================
  // Load available services
  // ============================
  useEffect(() => {
    if (!branchId || !pinnedStaffId || !pinnedStartIso) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await getAvailableServicesForSlot({
          branchId,
          staffId: pinnedStaffId,
          datetime: pinnedStartIso,
        });

        if (!cancelled) setServices(res ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [branchId, pinnedStaffId, pinnedStartIso]);

  // ============================
  // Actions
  // ============================
  function handleSelect(service: AvailableService) {
    if (!pinnedStaffId) return;

    actions.addService({
      serviceId: service.id,
      serviceName: service.name,

      staffId: pinnedStaffId,
      staffName: state.pinnedStaffName,

      durationMin: service.durationMin,
    });
  }

  // ============================
  // Render
  // ============================
  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight">
          Elige el primer servicio
        </h3>
        <p className="text-sm text-muted-foreground">
          Servicios disponibles para este horario
        </p>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      )}

      {/* EMPTY */}
      {!loading && services.length === 0 && (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No hay servicios disponibles para este horario.
          </p>
        </div>
      )}

      {/* LIST */}
      <div className="space-y-3">
        {services.map((s) => {
          const color = s.category?.colorHex ?? "#6366f1";

          return (
            <button
              key={s.id}
              onClick={() => handleSelect(s)}
              className={cn(
                "group w-full relative overflow-hidden rounded-2xl border transition-all",
                "flex items-center justify-between gap-4 px-4 py-4",
                "bg-white border-black/10 hover:bg-black/[0.02] hover:border-black/20",
                "active:scale-[0.99]"
              )}
            >
              {/* Color bar */}
              <span
                className="absolute left-0 top-0 h-full w-2.5"
                style={{ backgroundColor: color }}
              />

              {/* Left */}
              <div className="flex items-center gap-4 min-w-0">
                {/* Icon bubble */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-indigo-50 border-indigo-100 text-indigo-600">
                  <CategoryIcon
                    name={s.category?.icon}
                    className="h-4 w-4"
                  />
                </div>

                {/* Text */}
                <div className="min-w-0 text-left">
                  <p className="font-semibold tracking-tight truncate">
                    {s.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.durationMin} min
                  </p>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-3 shrink-0">
                {s.priceCents != null && (
                  <p className="text-base font-semibold">
                    ${(s.priceCents / 100).toFixed(2)}
                  </p>
                )}

                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-muted-foreground group-hover:bg-black/5">
                  <Check className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}