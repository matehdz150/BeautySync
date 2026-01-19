"use client";

import { CalendarClock } from "lucide-react";

export function EmptyNoAvailabilityState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
        <CalendarClock className="h-6 w-6 text-indigo-500" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-semibold">
          No hay disponibilidad
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Ningún servicio está disponible para este staff en este horario.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Prueba con otro horario o selecciona otro miembro del staff.
      </p>
    </div>
  );
}