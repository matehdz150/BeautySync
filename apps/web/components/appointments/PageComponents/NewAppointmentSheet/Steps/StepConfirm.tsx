"use client";

import { Button } from "@/components/ui/button";
import { DateTime } from "luxon";
import { useAppointmentBuilder } from "@/context/AppointmentBuilderContext";

export function StepConfirm({
  onBack,
  onConfirm,
}: {
  onBack: () => void;
  onConfirm: () => void;
}) {
  const { services, client } = useAppointmentBuilder();

  const total = services.reduce(
    (sum, s) => sum + s.service.priceCents,
    0
  );

  return (
    <div className="space-y-6 pt-6">

      {/* BREADCRUMB */}
      <p className="text-sm text-muted-foreground">
        Review &gt; Confirm
      </p>

      <h2 className="text-xl font-semibold">
        Confirm appointment
      </h2>

      {/* CLIENT INFO */}
      {client && (
        <div className="border rounded-lg p-4 bg-muted/20 space-y-1">
          <p className="font-medium">{client.name}</p>

          {client.email && (
            <p className="text-sm text-muted-foreground">
              {client.email}
            </p>
          )}

          <p className="text-sm text-muted-foreground">
            {client.phone ?? "No phone number"}
          </p>
        </div>
      )}

      {/* SERVICES */}
      <div className="space-y-4">
        {services.map((s) => (
          <div
            key={s.service.id}
            className="border rounded-lg p-4 flex justify-between items-start"
          >
            <div className="space-y-1">

              {/* SERVICE NAME + COLOR BAR */}
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-6 rounded-full"
                  style={{ backgroundColor: s.service.category?.colorHex ?? "#e5e7eb" }}
                />

                <p className="font-medium">
                  {s.service.name}
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                {s.service.durationMin} min
              </p>

              {/* Staff */}
              <p className="text-sm">
                <span className="text-muted-foreground">
                  Staff:&nbsp;
                </span>
                {s.staffName ?? "Any staff"}
              </p>

              {/* DATE / TIME */}
              <p className="text-sm">
                <span className="text-muted-foreground">
                  When:&nbsp;
                </span>

                {DateTime.fromISO(s.startISO!)
                  .setZone("America/Mexico_City")
                  .toFormat("EEE d MMM • h:mma")}
              </p>
            </div>

            {/* PRICE */}
            <p className="font-medium">
              ${(s.service.priceCents / 100).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* TOTAL */}
      <div className="border rounded-lg p-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total (incl. tax)
        </p>

        <p className="text-lg font-semibold">
          ${(total / 100).toFixed(2)}
        </p>
      </div>

      {/* FOOTER */}
      <div className="border-t pt-4 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>

        <Button onClick={onConfirm}>
          Confirm & Book
        </Button>
      </div>
    </div>
  );
}