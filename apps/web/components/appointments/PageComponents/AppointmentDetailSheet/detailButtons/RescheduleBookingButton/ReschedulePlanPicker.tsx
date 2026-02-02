"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBranch } from "@/context/BranchContext";

import {
  getManagerAvailabilityChain,
  type AvailabilityChainPlan,
} from "@/lib/services/availability";

import { rescheduleManagerBooking } from "@/lib/services/appointments";
import { RescheduleDatePicker } from "./RescheduleDatePicker";
import { useCalendar, useCalendarActions } from "@/context/CalendarContext";

type Props = {
  booking: any;
  onClose: () => void;
};

function todayISO() {
  return DateTime.now().setZone("America/Mexico_City").toISODate()!;
}

function buildChainFromBooking(booking: any) {
  return (booking?.appointments ?? [])
    .slice()
    .sort(
      (a: any, b: any) =>
        DateTime.fromISO(a.startIso).toMillis() -
        DateTime.fromISO(b.startIso).toMillis()
    )
    .map((a: any) => ({
      serviceId: a.service.id,
      staffId: a.staff.id,
    }));
}

export function ReschedulePlanPicker({ booking, onClose }: Props) {
  const { branch } = useBranch();
  const { reload } = useCalendar();
  const { closeAppointment } = useCalendarActions();

  const [date, setDate] = useState(todayISO());
  const [plans, setPlans] = useState<AvailabilityChainPlan[]>([]);
  const [selected, setSelected] = useState<AvailabilityChainPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ CHAIN CONGELADO (no cambia por re-renders del parent)
  const [chain] = useState(() => buildChainFromBooking(booking));

  // (Opcional) por si quieres mostrar algo extra: lookup rápido
  const serviceNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const appt of booking?.appointments ?? []) {
      map.set(appt.service.id, appt.service.name);
    }
    return map;
  }, [booking?.appointments]);

  useEffect(() => {
    if (!branch?.id) return;

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await getManagerAvailabilityChain({
          branchId: branch.id,
          body: { date, chain },
        });

        if (!alive) return;

        setPlans(Array.isArray(res) ? res : []);
        setSelected(null);
      } catch (e) {
        if (!alive) return;
        setPlans([]);
        setError("No hay horarios disponibles");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [branch?.id, date, chain]);

  async function handleConfirm() {
    if (!selected || confirming) return;

    try {
      setConfirming(true);

      // ✅ NUEVA FIRMA: YA VA UTC
      await rescheduleManagerBooking({
        bookingId: booking.id,
        newStartIso: selected.startIso,
        reason: "ADMIN",
      });

      reload();

      closeAppointment();
    } catch (e) {
      console.error("❌ frontend error", e);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="flex flex-col h-[28rem] overflow-hidden">
      {/* HEADER */}
      <div className="shrink-0">
        <RescheduleDatePicker value={date} onChange={setDate} />
      </div>

      {/* BODY (SCROLL REAL) */}
      {/* BODY (SCROLL REAL) */}
      <div className="h-[18rem] overflow-y-auto pr-2"
      onWheelCapture={(e) => e.stopPropagation()}>
        <div className="space-y-2 py-2">
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}

          {!loading &&
            plans.map((p) => {
              const isSelected = selected?.startIso === p.startIso;

              return (
                <button
                  key={p.startIso}
                  type="button"
                  onClick={() => setSelected(p)}
                  className={cn(
                    "w-full px-3 py-4 rounded-md border text-left transition",
                    isSelected
                      ? "border-indigo-500 bg-indigo-50"
                      : "hover:border-indigo-400"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{p.startLocalLabel}</span>
                  </div>

                  {p.assignments?.length ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {p.assignments
                        .map(
                          (a) => serviceNameById.get(a.serviceId) ?? "Servicio"
                        )
                        .join(" → ")}
                    </div>
                  ) : null}
                </button>
              );
            })}

          {!loading && plans.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {error ?? "No hay horarios disponibles"}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="shrink-0 pt-3 border-t flex gap-2 bg-white">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          className="flex-1"
          disabled={!selected || confirming}
          onClick={handleConfirm}
        >
          {confirming ? "Reagendando..." : "Confirmar"}
        </Button>
      </div>
    </div>
  );
}
