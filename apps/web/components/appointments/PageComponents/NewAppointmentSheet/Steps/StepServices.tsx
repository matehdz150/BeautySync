"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/context/BranchContext";
import { getServicesByBranch } from "@/lib/services/services";
import { Search, Check } from "lucide-react";
import { useCalendar } from "@/context/CalendarContext";
import { EmptyServicesState } from "./EmptyServicesState";
import { EmptyNoAvailabilityState } from "./EmptyNoAvailabilityState";

import {
  DraftService,
  useBookingManagerDraft,
} from "@/context/BookingManagerDraftContext";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/shared/Icon";

export function StepServices() {
  const { branch } = useBranch();
  const { state: calendarState } = useCalendar();

  const { state, actions } = useBookingManagerDraft();

  const [allServices, setAllServices] = useState<DraftService[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const preset = calendarState.prefill?.presetServices as
    | DraftService[]
    | undefined;

  // Si vienes del GRID → usa preset
  // Si NO → carga del branch
  useEffect(() => {
    if (preset !== undefined) {
      setAllServices(preset);
      setLoading(false);
      return;
    }

    if (!branch) return;

    setLoading(true);

    getServicesByBranch(branch.id)
      .then((res) => setAllServices((res ?? []) as DraftService[]))
      .finally(() => setLoading(false));
  }, [branch, preset]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allServices;
    return allServices.filter((s) => s.name.toLowerCase().includes(q));
  }, [allServices, query]);

  const grouped = useMemo(() => {
    const map: Record<string, { color: string; services: DraftService[] }> = {};

    filtered.forEach((s) => {
      const key = s.category?.name ?? "Other";
      const color = s.category?.colorHex ?? "#E5E7EB";

      if (!map[key]) map[key] = { color, services: [] };
      map[key].services.push(s);
    });

    return map;
  }, [filtered]);

  const selectedIds = useMemo(() => {
    return new Set(state.services.map((s) => s.id));
  }, [state.services]);

  const fromGrid = preset !== undefined;

  return (
    <div className="flex flex-col">
      {/* 🔍 Search */}
      <div className="px-5 pt-2 pb-3 sticky top-0 z-10 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar servicios"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 py-6 shadow-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="px-5 pb-4">
        <div className="space-y-8 max-h-145 overflow-y-auto pr-1">
          {loading && (
            <>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          )}

          {!loading &&
            Object.entries(grouped).map(([cat, { color, services }]) => (
              <div key={cat} className="space-y-3">
                <div className="flex items-center gap-2 mt-2">
                  <p className="font-medium">{cat}</p>
                  <span className="text-xs bg-white border px-2 py-0.5 rounded-full">
                    {services.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {services.map((s) => {
                    const isSelected = selectedIds.has(s.id);

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => actions.toggleService(s)}
                        className={cn(
                          "group w-full relative overflow-hidden rounded-2xl border transition-all",
                          "flex items-center justify-between gap-4 px-4 py-4",
                          "active:scale-[0.99]",
                          isSelected
                            ? "bg-indigo-500 text-white border-indigo-500 ring-4 ring-indigo-500/20 shadow-lg"
                            : "bg-white border-black/10 hover:bg-black/[0.02] hover:border-black/20"
                        )}
                      >
                        {/* Color bar */}
                        <span
                          className={cn(
                            "absolute left-0 top-0 h-full w-2.5 transition-opacity",
                            isSelected ? "bg-transparent" : ""
                          )}
                          style={{
                            backgroundColor: isSelected ? undefined : color,
                          }}
                        />

                        {/* Left content */}
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Icon bubble */}
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full border transition",
                              isSelected
                                ? "bg-white/15 border-white/30"
                                : "bg-indigo-50 border-indigo-100 text-indigo-600"
                            )}
                          >
                            {isSelected ? (
                              <Check className="h-4 w-4 opacity-100" />
                            ) : (
                              <CategoryIcon
                                name={s.category?.icon}
                                className="h-4 w-4"
                              />
                            )}
                          </div>

                          {/* Text */}
                          <div className="min-w-0 text-left">
                            <p className="font-semibold tracking-tight truncate">
                              {s.name}
                            </p>

                            <p
                              className={cn(
                                "text-xs",
                                isSelected
                                  ? "text-white/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {s.durationMin} min
                            </p>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="shrink-0 text-right">
                          <p
                            className={cn(
                              "text-base font-semibold",
                              isSelected ? "text-white" : "text-black"
                            )}
                          >
                            $
                            {(((s.priceCents ?? 0) as number) / 100).toFixed(2)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

          {!loading &&
            filtered.length === 0 &&
            (fromGrid ? <EmptyNoAvailabilityState /> : <EmptyServicesState />)}
        </div>
      </div>
    </div>
  );
}
