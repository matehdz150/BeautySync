"use client";

import { useEffect, useState, useMemo } from "react";
import { DateTime } from "luxon";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { useSlotBooking } from "@/context/SlotBookingContext";
import { api } from "@/lib/services/api";

/* =========================
   Types
========================= */

type StaffOption = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

type AvailableService = {
  id: string;
  name: string;
  durationMin: number;
  priceCents?: number | null;
  categoryColor?: string | null;

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

  const [availableServices, setAvailableServices] =
    useState<AvailableService[]>([]);
  const [loading, setLoading] = useState(false);

  const { branchId, services } = state;
  const lastService = services[services.length - 1];

  /* ============================
     Next startIso
  ============================ */

  const nextStartIso = useMemo(() => {
    if (!lastService) return null;

    return DateTime
      .fromISO(lastService.startIso)
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
     Actions
  ============================ */

  function addService(
    service: AvailableService,
    staffId: string | "ANY"
  ) {
    actions.addService({
      serviceId: service.id,
      staffId,
      durationMin: service.durationMin,
    });
  }

  function goToReview() {
    actions.setStep(3);
  }

  /* ============================
     Render
  ============================ */

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div>
        <h3 className="text-sm font-semibold">Current booking</h3>

        <div className="space-y-2 pt-2">
          {services.map((s, i) => {
            const start = DateTime.fromISO(s.startIso).toLocal();

            return (
              <div
                key={i}
                className="rounded-md border px-3 py-2 text-sm flex justify-between"
              >
                <div>
                  <div className="font-medium">
                    {i + 1}. {s.serviceId}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {start.toFormat("HH:mm")} · {s.durationMin}m
                  </div>
                </div>

                <Badge variant="outline">
                  {s.staffId === "ANY" ? "Any staff" : s.staffId}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Add more */}
      <div>
        <h3 className="text-sm font-semibold">Add another service</h3>
        <p className="text-xs text-muted-foreground">
          Select a service and assign a staff member.
        </p>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">
          Loading services…
        </div>
      )}

      {!loading && availableServices.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No more services available.
        </div>
      )}

      <div className="space-y-4">
        {availableServices.map((s) => (
          <div
            key={s.id}
            className="rounded-lg border p-4 space-y-3"
          >
            {/* Service info */}
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">
                  {s.durationMin} min
                  {s.priceCents != null && (
                    <> · ${(s.priceCents / 100).toFixed(2)}</>
                  )}
                </div>
              </div>

              <Badge variant="secondary">Select staff</Badge>
            </div>

            {/* Staff selection */}
            <div className="flex flex-wrap gap-2">
              {s.allowAny && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addService(s, "ANY")}
                >
                  Any staff
                </Button>
              )}

              {s.staff.map((st) => (
                <Button
                  key={st.id}
                  size="sm"
                  variant="outline"
                  onClick={() => addService(s, st.id)}
                >
                  {st.name}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={goToReview}>
          Review booking
        </Button>
      </div>
    </div>
  );
}