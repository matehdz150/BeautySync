"use client";

import { useEffect, useState, useMemo } from "react";
import { DateTime } from "luxon";
import { Check, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { useSlotBooking } from "@/context/SlotBookingContext";
import { api } from "@/lib/services/api";
import { cn } from "@/lib/utils";
import { StaffPicker } from "./Staffpicker/StaffPicker";

/* =========================
   Types
========================= */

type StaffOption = {
  id: string;
  name: string;
};

type AvailableService = {
  id: string;
  name: string;
  durationMin: number;
  priceCents?: number | null;
  allowAny: boolean;
  staff: StaffOption[];
};

type AvailableServicesResponse = {
  ok: true;
  services: AvailableService[];
};

/* =========================
   Component
========================= */

export function StepConfirmAddMore() {
  const { state, actions } = useSlotBooking();

  const [availableServices, setAvailableServices] = useState<
    AvailableService[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const { branchId, services } = state;
  const lastService = services[services.length - 1];

  /* ============================
     Next startIso
  ============================ */

  const nextStartIso = useMemo(() => {
    if (!lastService) return null;

    return DateTime.fromISO(lastService.startIso)
      .plus({ minutes: lastService.durationMin })
      .toISO();
  }, [lastService]);

  /* ============================
     Load available services
  ============================ */

  useEffect(() => {
    if (!branchId || !nextStartIso) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await api<AvailableServicesResponse>(
          "/availability/available-services-at",
          {
            method: "POST",
            body: JSON.stringify({
              branchId,
              datetime: nextStartIso,
            }),
          }
        );

        if (!cancelled) setAvailableServices(res.services ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [branchId, nextStartIso]);

  /* ============================
     Search
  ============================ */

  const filteredServices = useMemo(() => {
    if (!search.trim()) return availableServices;
    const q = search.toLowerCase();
    return availableServices.filter((s) => s.name.toLowerCase().includes(q));
  }, [availableServices, search]);

  /* ============================
     Actions
  ============================ */

  function addService(service: AvailableService) {
    actions.addService({
      serviceId: service.id,
      serviceName: service.name,
      staffId: "ANY",
      durationMin: service.durationMin,
    });
  }

  /* ============================
     Render
  ============================ */

  return (
    <div className="space-y-8">
      {/* ================= CURRENT BOOKING ================= */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold tracking-tight">
          Servicios seleccionados
        </h3>

        <div className="space-y-3">
          {services.map((s, i) => {
            const start = DateTime.fromISO(s.startIso).toLocal();

            const staffOptions =
              availableServices.find((av) => av.id === s.serviceId)?.staff ??
              [];

            return (
              <div
                key={i}
                className="rounded-2xl border bg-white px-4 py-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {i + 1}. {s.serviceName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {start.toFormat("HH:mm")} · {s.durationMin} min
                    </p>
                  </div>

                  <Badge variant="secondary">
                    {s.staffId === "ANY" ? "Staff por asignar" : s.staffName}
                  </Badge>
                </div>

                {/* STAFF SELECT */}
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Staff
                  </label>

                  {i === 0 ? (
                    // 🔒 PRIMER SERVICIO → READ ONLY
                    <div className="w-full rounded-xl border px-3 py-2 text-sm bg-muted/40 text-muted-foreground flex items-center justify-between">
                      <span>
                        {s.staffId === "ANY"
                          ? "Staff asignado automáticamente"
                          : s.staffName}
                      </span>

                      <Badge variant="outline" className="text-[10px]">
                        Fijado
                      </Badge>
                    </div>
                  ) : (
                    // ✏️ SERVICIOS ADICIONALES → EDITABLE
                    <StaffPicker
                      value={s.staffId}
                      staffOptions={staffOptions}
                      onChange={(staffId, staffName) => {
                        actions.setStaffForService(i, staffId, staffName);
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* ================= ADD MORE ================= */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight">
            Agregar otro servicio
          </h3>
          <p className="text-sm text-muted-foreground">
            Opcional · Se agregará después del último servicio
          </p>
        </div>

        <Input
          placeholder="Buscar servicio…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="py-6"
        />
      </div>

      {/* ================= LIST ================= */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      )}

      {!loading && filteredServices.length === 0 && (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No hay servicios disponibles.
        </div>
      )}

      <div className="space-y-3">
        {filteredServices.map((s) => (
          <button
            key={s.id}
            onClick={() => addService(s)}
            className={cn(
              "group w-full rounded-2xl border px-4 py-4 transition",
              "flex items-center justify-between gap-4",
              "bg-white hover:bg-black/[0.02] hover:border-black/20",
              "active:scale-[0.99]"
            )}
          >
            <div className="min-w-0 text-left">
              <p className="font-semibold truncate">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {s.durationMin} min
                {s.priceCents != null && (
                  <> · ${(s.priceCents / 100).toFixed(2)}</>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-indigo-50 text-indigo-600">
                <Plus className="h-4 w-4" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
