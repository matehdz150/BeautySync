"use client";

import { useState } from "react";
import { DateTime } from "luxon";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  staffId: string;
  startISO?: string;
};

export function StaffTimeOffSheet({
  open,
  onOpenChange,
  staffId,
  startISO,
}: Props) {
  const startDefault = startISO ? DateTime.fromISO(startISO) : DateTime.now();

  const [date, setDate] = useState(startDefault.toISODate()!);
  const [startTime, setStartTime] = useState(startDefault.toFormat("HH:mm"));
  const [endTime, setEndTime] = useState(
    startDefault.plus({ hours: 1 }).toFormat("HH:mm"),
  );

  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="
          w-full !max-w-[32rem]
          bg-white
          flex flex-col
          h-[100dvh]
        "
      >
        <div className="px-6 py-5 border-b">
          <h2 className="text-lg font-semibold">Bloquear horario</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Fecha */}
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Fecha</label>

            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Hora inicio */}
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Hora inicio</label>

            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          {/* Hora fin */}
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Hora fin</label>

            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Motivo (opcional)</label>

            <Textarea
              placeholder="Vacaciones, descanso, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="
            border-t
            px-6 py-4
            flex justify-end
            gap-3
          "
        >
          <button
            onClick={() => onOpenChange(false)}
            className="text-sm text-gray-600"
          >
            Cancelar
          </button>

          <button
            disabled={loading}
            className="
              bg-black
              text-white
              text-sm
              px-4 py-2
              rounded-md
              hover:opacity-90
            "
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
