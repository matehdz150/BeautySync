"use client";

import { Button } from "@/components/ui/button";
import { DateTime } from "luxon";

import { useAppointmentBuilder } from "@/context/AppointmentBuilderContext";
import { useBookingManagerDraft } from "@/context/BookingManagerDraftContext";

export function StepConfirm({
  onBack,
  onConfirm,
}: {
  onBack: () => void;
  onConfirm: () => void;
}) {
  const { client } = useAppointmentBuilder(); // legacy (por ahora)
  const { state: draft, actions: draftActions } = useBookingManagerDraft();

  const selectedPlan = draftActions.getSelectedPlan();

  const totalCents =
    selectedPlan?.assignments.reduce((sum, a) => {
      const srv = draft.services.find((s) => s.id === a.serviceId);
      return sum + (srv?.priceCents ?? 0);
    }, 0) ?? 0;

  if (!selectedPlan) {
    return (
      <div className="space-y-6 pt-6">
        <p className="text-sm text-muted-foreground">Review &gt; Confirm</p>

        <h2 className="text-xl font-semibold">Confirm appointment</h2>

        <p className="text-sm text-muted-foreground">
          No plan selected yet. Go back and select a time.
        </p>

        <div className="border-t pt-4 flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>

          <Button disabled onClick={onConfirm}>
            Confirm &amp; Book
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {/* BREADCRUMB */}
      <p className="text-sm text-muted-foreground">Review &gt; Confirm</p>

      <h2 className="text-xl font-semibold">Confirm appointment</h2>

      {/* CLIENT INFO */}
      {client && (
        <div className="border rounded-lg p-4 bg-muted/20 space-y-1">
          <p className="font-medium">{client.name}</p>

          {client.email && (
            <p className="text-sm text-muted-foreground">{client.email}</p>
          )}

          <p className="text-sm text-muted-foreground">
            {client.phone ?? "No phone number"}
          </p>
        </div>
      )}

      {/* SERVICES (desde el plan seleccionado) */}
      <div className="space-y-4">
        {selectedPlan.assignments.map((a, idx) => {
          const srv = draft.services.find((s) => s.id === a.serviceId);

          const startLabel = DateTime.fromISO(a.startLocalIso)
            .setZone("America/Mexico_City")
            .toFormat("EEE d MMM • h:mma");

          return (
            <div
              key={`${a.serviceId}-${idx}`}
              className="border rounded-lg p-4 flex justify-between items-start"
            >
              <div className="space-y-1">
                {/* SERVICE NAME + COLOR BAR */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-6 rounded-full"
                    style={{
                      backgroundColor:
                        srv?.category?.colorHex ?? "#e5e7eb",
                    }}
                  />

                  <p className="font-medium">{srv?.name ?? "Service"}</p>
                </div>

                <p className="text-sm text-muted-foreground">
                  {a.durationMin} min
                </p>

                {/* Staff */}
                <p className="text-sm">
                  <span className="text-muted-foreground">Staff:&nbsp;</span>
                  {a.staffId}
                </p>

                {/* DATE / TIME */}
                <p className="text-sm">
                  <span className="text-muted-foreground">When:&nbsp;</span>
                  {startLabel}
                </p>
              </div>

              {/* PRICE */}
              <p className="font-medium">
                ${(((srv?.priceCents ?? 0) / 100) as number).toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>

      {/* TOTAL */}
      <div className="border rounded-lg p-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Total</p>

        <p className="text-lg font-semibold">
          ${(totalCents / 100).toFixed(2)}
        </p>
      </div>

      {/* FOOTER */}
      <div className="border-t pt-4 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>

        <Button onClick={onConfirm}>Confirm &amp; Book</Button>
      </div>
    </div>
  );
}