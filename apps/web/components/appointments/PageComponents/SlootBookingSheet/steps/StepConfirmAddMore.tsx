"use client";

import { useEffect, useState, useMemo } from "react";
import { DateTime } from "luxon";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

import { useSlotBooking } from "@/context/SlotBookingContext";
import { api } from "@/lib/services/api";

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

        if (!cancelled) {
          setAvailableServices(res.services ?? []);
        }
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
    <div className="space-y-6">
      {/* ================= Current booking ================= */}
      <div>
        <h3 className="text-sm font-semibold">Current booking</h3>

        <div className="space-y-3 pt-3">
          {services.map((s, i) => {
            const start = DateTime.fromISO(s.startIso).toLocal();

            const staffOptions =
              availableServices.find((av) => av.id === s.serviceId)?.staff ??
              [];

            return (
              <div key={i} className="rounded-md border p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {i + 1}. {s.serviceName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {start.toFormat("HH:mm")} · {s.durationMin} min
                    </div>
                  </div>

                  <Badge variant="outline">
                    {s.staffId === "ANY" ? "Staff not assigned" : s.staffName}
                  </Badge>
                </div>

                {/* STAFF DROPDOWN */}
                <select
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={s.staffId}
                  onChange={(e) => {
                    const staffId = e.target.value as string | "ANY";

                    const staff =
                      staffId === "ANY"
                        ? undefined
                        : staffOptions.find((st) => st.id === staffId);

                    actions.setStaffForService(i, staffId, staff?.name);
                  }}
                >
                  <option value="ANY">Any staff</option>

                  {staffOptions.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* ================= Add service ================= */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Add another service</h3>
        <p className="text-xs text-muted-foreground">
          Select a service to add it to the booking.
        </p>

        <Input
          placeholder="Search service…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Loading services…</div>
      )}

      {!loading && filteredServices.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No services match your search.
        </div>
      )}

      <div className="space-y-3">
        {filteredServices.map((s) => (
          <div
            key={s.id}
            className="rounded-lg border px-4 py-3 flex justify-between items-center"
          >
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-muted-foreground">
                {s.durationMin} min
                {s.priceCents != null && (
                  <> · ${(s.priceCents / 100).toFixed(2)}</>
                )}
              </div>
            </div>

            <Button size="sm" onClick={() => addService(s)}>
              Add
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
