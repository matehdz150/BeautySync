"use client";

import { useEffect, useState } from "react";
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
};

/* =========================
   Component
========================= */

export function StepReviewBooking() {
  const { state, actions } = useSlotBooking();
  const { branchId, services } = state;

  const [staffOptions, setStaffOptions] = useState<
    Record<number, StaffOption[]>
  >({});

  const [loadingStaff, setLoadingStaff] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* ============================
     Load staff for a service
  ============================ */

  async function loadStaff(index: number, serviceId: string) {
    if (!branchId) return;

    setLoadingStaff(index);

    try {
      const res = await api<{ staff: StaffOption[] }>(
        `/staff/for-service?branchId=${branchId}&serviceId=${serviceId}`
      );

      setStaffOptions((prev) => ({
        ...prev,
        [index]: res.staff ?? [],
      }));
    } finally {
      setLoadingStaff(null);
    }
  }

  /* ============================
     Confirm booking
  ============================ */

  async function confirmBooking() {
    if (!branchId) return;

    setSubmitting(true);

    try {
      await api("/bookings", {
        method: "POST",
        body: JSON.stringify({
          branchId,
          services: services.map((s) => ({
            serviceId: s.serviceId,
            staffId: s.staffId,
            startIso: s.startIso,
            durationMin: s.durationMin,
          })),
        }),
      });

      actions.reset();
    } finally {
      setSubmitting(false);
    }
  }

  /* ============================
     Render
  ============================ */

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">Review booking</h3>
        <p className="text-xs text-muted-foreground">
          Assign staff for each service before confirming.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        {services.map((s, index) => {
          const start = DateTime.fromISO(s.startIso).toLocal();
          const isFirst = index === 0;

          return (
            <div
              key={index}
              className="rounded-lg border p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">
                    {index + 1}. {s.serviceId}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {start.toFormat("HH:mm")} · {s.durationMin} min
                  </div>
                </div>

                <Badge variant={isFirst ? "secondary" : "outline"}>
                  {s.staffId === "ANY" ? "Any staff" : s.staffId}
                </Badge>
              </div>

              {/* First service locked */}
              {isFirst && (
                <div className="text-xs text-muted-foreground">
                  Staff for the first service is fixed.
                </div>
              )}

              {/* Staff actions (only for services > 1) */}
              {!isFirst && (
                <>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant={
                        s.staffId === "ANY" ? "default" : "outline"
                      }
                      onClick={() =>
                        actions.setStaffForService(index, "ANY")
                      }
                    >
                      Any staff
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        loadStaff(index, s.serviceId)
                      }
                      disabled={loadingStaff === index}
                    >
                      {loadingStaff === index
                        ? "Loading staff…"
                        : "Choose staff"}
                    </Button>
                  </div>

                  {/* Staff list */}
                  {staffOptions[index] && (
                    <div className="pt-2 grid grid-cols-2 gap-2">
                      {staffOptions[index].map((st) => (
                        <Button
                          key={st.id}
                          size="sm"
                          variant={
                            s.staffId === st.id
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            actions.setStaffForService(index, st.id)
                          }
                        >
                          {st.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <Separator />

      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => actions.setStep(2)}
        >
          Back
        </Button>

        <Button
          onClick={confirmBooking}
          disabled={submitting}
        >
          {submitting ? "Confirming…" : "Confirm booking"}
        </Button>
      </div>
    </div>
  );
}