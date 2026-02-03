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
  const { client } = useAppointmentBuilder();
  const { state: draft, actions: draftActions } = useBookingManagerDraft();

  const selectedPlan = draftActions.getSelectedPlan();

  const totalCents =
    selectedPlan?.assignments.reduce((sum, a) => {
      const srv = draft.services.find((s) => s.id === a.serviceId);
      return sum + (srv?.priceCents ?? 0);
    }, 0) ?? 0;

  if (!selectedPlan) {
    return (
      <div className="pt-8 text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Revisión → Confirmación
        </p>

        <h2 className="text-xl font-semibold">No hay horario seleccionado</h2>

        <p className="text-sm text-muted-foreground">
          Regresa y selecciona una fecha y hora para continuar.
        </p>

        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {/* HEADER */}
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Revisión → Confirmación
        </p>

        <h2 className="text-2xl font-semibold tracking-tight">
          Confirmar cita
        </h2>
      </div>

      {/* CLIENT CARD */}
      {client && (
        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <p className="text-xs text-muted-foreground">Cliente</p>
          <p className="font-medium">{client.name}</p>

          <div className="mt-1 text-sm text-muted-foreground">
            {client.email && <p>{client.email}</p>}
            <p>{client.phone ?? "Sin teléfono"}</p>
          </div>
        </div>
      )}

      {/* SERVICES TIMELINE */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 space-y-4">
        <p className="text-sm font-semibold">Servicios y horario</p>

        <div className="space-y-3">
          {selectedPlan.assignments.map((a, idx) => {
            const srv = draft.services.find((s) => s.id === a.serviceId);

            const start = DateTime.fromISO(a.startLocalIso)
              .setZone("America/Mexico_City")
              .toFormat("HH:mm");

            const end = DateTime.fromISO(a.endLocalIso)
              .setZone("America/Mexico_City")
              .toFormat("HH:mm");

            return (
              <div key={`${a.serviceId}-${idx}`} className="flex gap-3">
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        srv?.category?.colorHex ?? "#6366f1",
                    }}
                  />
                  {idx !== selectedPlan.assignments.length - 1 && (
                    <div className="mt-1 w-px flex-1 bg-black/10" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{srv?.name ?? "Servicio"}</p>
                    <p className="text-xs text-muted-foreground">
                      {start} – {end} · {a.durationMin} min
                    </p>
                  </div>

                  <p className="text-sm font-medium">
                    ${(((srv?.priceCents ?? 0) / 100) as number).toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOTAL */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Total</p>
        <p className="text-xl font-semibold">
          ${(totalCents / 100).toFixed(2)}
        </p>
      </div>

      {/* ACTIONS */}
      <div className="pt-4 flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>

        <Button
          className="rounded-full px-6"
          onClick={onConfirm}
        >
          Confirmar cita
        </Button>
      </div>
    </div>
  );
}