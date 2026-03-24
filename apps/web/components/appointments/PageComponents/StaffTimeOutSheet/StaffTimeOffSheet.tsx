"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { useTimeOffDraft } from "@/context/TimeOffDraftContext";
import { useTimeOffActions } from "@/context/TimeOffDraftContext";
import { buildTimeOffPayload } from "@/lib/helpers/buildTimeOffPayload";
import { createStaffTimeOff } from "@/lib/services/staff-time-off";
import { StaffSelector } from "./StaffSelector";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  branchId: string; // 🔥 ahora usamos branchId
  startISO?: string;
};

const WEEK_DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

export function StaffTimeOffSheet({
  open,
  onOpenChange,
  branchId,
  startISO,
}: Props) {
  const { state } = useTimeOffDraft();
  const { init, setField, setMode, toggleDay } = useTimeOffActions();

  const [loading, setLoading] = useState(false);

  // 🔥 INIT
  useEffect(() => {
    if (open) {
      init(startISO);
    }
  }, [open, startISO]);

  // 🔎 Preview
  const preview = useMemo(() => {
    if (state.mode === "SINGLE") {
      return `${state.date} · ${state.startTime} - ${state.endTime}`;
    }

    if (state.recurrenceType === "DAILY") {
      return `Todos los días · ${state.startTime} - ${state.endTime}`;
    }

    return `Semanal · ${state.daysOfWeek.length} día(s) · ${state.startTime} - ${state.endTime}`;
  }, [state]);

  async function handleSubmit() {
    if (loading) return;

    if (!state.staffId) {
      alert("Selecciona un staff");
      return;
    }

    setLoading(true);

    if (!branchId) {
      alert("Sucursal inválida");
      return;
    }

    try {
      const payload = {
        ...buildTimeOffPayload(state),
        branchId,
      };

      await createStaffTimeOff(payload);

      onOpenChange(false);
    } catch (e: any) {
      console.error(e);

      switch (e.message) {
        case "INVALID_DATETIME":
          alert("Fecha inválida");
          break;
        case "INVALID_RANGE":
          alert("La hora de fin debe ser mayor");
          break;
        case "NO_DAYS_SELECTED":
          alert("Selecciona al menos un día");
          break;
        default:
          alert("No se pudo guardar");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full !max-w-[32rem] bg-white flex flex-col h-[100dvh] p-0"
      >
        <SheetHeader className="px-6 py-5 border-b text-left">
          <SheetTitle>Bloquear horario</SheetTitle>
          <SheetDescription>
            Crea un bloqueo individual o una regla recurrente.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* 🔥 STAFF SELECTOR */}
          <StaffSelector branchId={branchId} />

          {/* PREVIEW */}
          <div className="rounded-2xl border bg-gray-50 px-4 py-3">
            <p className="text-sm font-medium">Preview</p>
            <p className="text-sm text-muted-foreground mt-1">{preview}</p>
          </div>

          {/* MODE */}
          <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
            <Checkbox
              checked={state.mode === "RECURRING"}
              onCheckedChange={(v) => setMode(v ? "RECURRING" : "SINGLE")}
            />
            <Label className="cursor-pointer">Repetir bloqueo</Label>
          </div>

          {/* SINGLE */}
          {state.mode === "SINGLE" ? (
            <>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={state.date}
                  onChange={(e) => setField("date", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora inicio</Label>
                  <Input
                    type="time"
                    value={state.startTime}
                    onChange={(e) => setField("startTime", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hora fin</Label>
                  <Input
                    type="time"
                    value={state.endTime}
                    onChange={(e) => setField("endTime", e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* TYPE */}
              <div className="space-y-2">
                <Label>Tipo de repetición</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setField("recurrenceType", "DAILY")}
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      state.recurrenceType === "DAILY"
                        ? "bg-black text-white border-black"
                        : "bg-white"
                    }`}
                  >
                    Diario
                  </button>

                  <button
                    type="button"
                    onClick={() => setField("recurrenceType", "WEEKLY")}
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      state.recurrenceType === "WEEKLY"
                        ? "bg-black text-white border-black"
                        : "bg-white"
                    }`}
                  >
                    Semanal
                  </button>
                </div>
              </div>

              {/* DAYS */}
              {state.recurrenceType === "WEEKLY" && (
                <div className="space-y-2">
                  <Label>Días de la semana</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => {
                      const active = state.daysOfWeek.includes(day.value);

                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`h-10 min-w-10 rounded-full border px-3 text-sm ${
                            active
                              ? "bg-black text-white border-black"
                              : "bg-white"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TIME */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="time"
                  value={state.startTime}
                  onChange={(e) => setField("startTime", e.target.value)}
                />
                <Input
                  type="time"
                  value={state.endTime}
                  onChange={(e) => setField("endTime", e.target.value)}
                />
              </div>

              {/* RANGE */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  value={state.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                />
                <Input
                  type="date"
                  value={state.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                />
              </div>
            </>
          )}

          {/* REASON */}
          <Textarea
            placeholder="Motivo..."
            value={state.reason}
            onChange={(e) => setField("reason", e.target.value)}
          />
        </div>

        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>

          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
