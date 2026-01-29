"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";

import { useSlotBooking } from "@/context/SlotBookingContext";
import { getAvailableServicesForSlot } from "@/lib/services/availability";

type AvailableService = {
  id: string;
  name: string;
  durationMin: number;
  priceCents?: number | null;
  category?: {
    colorHex?: string | null;
  } | null;
};

export function StepPickFirstService() {
  const { state, actions } = useSlotBooking();

  const [services, setServices] = useState<AvailableService[]>([]);
  const [loading, setLoading] = useState(false);

  const { branchId, pinnedStaffId, pinnedStartIso } = state;

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

        if (!cancelled) {
          setServices(res ?? []);
        }
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
      serviceName: service.name, // ✅ GUARDAR NOMBRE

      staffId: pinnedStaffId, // 🔒 pinned
      staffName: state.pinnedStaffName, // ✅ VIENE DEL CONTEXTO

      durationMin: service.durationMin,
    });

    // el reducer ya mueve al step 2
  }

  // ============================
  // Render
  // ============================
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Select first service</h3>
        <p className="text-xs text-muted-foreground">
          These services are available at the selected time.
        </p>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Loading services…</div>
      )}

      {!loading && services.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No services available for this slot.
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSelect(s)}
            className="
              w-full text-left
              rounded-lg border
              px-4 py-3
              hover:bg-muted/50
              transition
            "
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{s.name}</div>
                <div className="text-xs text-muted-foreground">
                  {s.durationMin} min
                  {s.priceCents != null && (
                    <> · ${(s.priceCents / 100).toFixed(2)}</>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="h-3 w-3 rounded-full border"
                  style={{
                    backgroundColor: s.category?.colorHex ?? "#A78BFA",
                  }}
                />
                <Badge variant="secondary">Select</Badge>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
