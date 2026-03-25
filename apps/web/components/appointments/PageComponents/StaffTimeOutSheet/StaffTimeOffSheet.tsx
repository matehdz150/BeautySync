"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { useTimeOffDraft } from "@/context/TimeOffDraftContext";
import { useTimeOffActions } from "@/context/TimeOffDraftContext";
import { buildTimeOffPayload } from "@/lib/helpers/buildTimeOffPayload";
import { createStaffTimeOff } from "@/lib/services/staff-time-off";

import { StaffSelector } from "./StaffSelector";
import { DateSelector } from "./DateSelector";
import { TimePickerInput } from "./TimeSelector";
import { RecurrenceSelector } from "./RecurrenceSelector";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  branchId: string;
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

const RECURRENCE_OPTIONS = [
  { value: "NONE", label: "Sin repetición" },
  { value: "DAILY", label: "Diario" },
  { value: "WEEKLY", label: "Cada semana" },
  { value: "MONTHLY", label: "Cada mes" },
];

export function StaffTimeOffSheet({
  open,
  onOpenChange,
  branchId,
  startISO,
}: Props) {
  const { state } = useTimeOffDraft();
  const { init, setField, toggleDay } = useTimeOffActions();

  const [loading, setLoading] = useState(false);

  // INIT
  useEffect(() => {
    if (open) {
      init(startISO);
    }
  }, [open, startISO]);

  // PREVIEW (mejorado)
  const preview = useMemo(() => {
    if (state.recurrenceType === "NONE") {
      return `${state.date} · ${state.startTime} - ${state.endTime}`;
    }

    if (state.recurrenceType === "DAILY") {
      return `Todos los días · ${state.startTime} - ${state.endTime}`;
    }

    if (state.recurrenceType === "WEEKLY") {
      return `Semanal · ${state.daysOfWeek.length} día(s) · ${state.startTime} - ${state.endTime}`;
    }

    return `Mensual · ${state.startTime} - ${state.endTime}`;
  }, [state]);

  async function handleSubmit() {
    if (loading) return;

    if (!state.staffId) {
      alert("Selecciona un staff");
      return;
    }

    if (!branchId) {
      alert("Sucursal inválida");
      return;
    }

    setLoading(true);

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
      <SheetContent className="w-full !max-w-[32rem] bg-white flex flex-col h-[100dvh] p-0">
        <SheetHeader className="px-6 py-5 border-b text-left">
          <SheetTitle>Bloquear horario</SheetTitle>
          <SheetDescription>
            Crea un bloqueo individual o recurrente.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* FECHA */}
          <div className="space-y-2">
            <Label>Fecha</Label>
            <DateSelector
              value={state.date}
              onChange={(d) => setField("date", d)}
            />
          </div>

          {/* HORAS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hora inicio</Label>
              <TimePickerInput
                value={state.startTime}
                onChange={(t) => setField("startTime", t)}
              />
            </div>

            <div className="space-y-2">
              <Label>Hora fin</Label>
              <TimePickerInput
                value={state.endTime}
                onChange={(t) => setField("endTime", t)}
              />
            </div>
          </div>

          {/* STAFF */}
          <StaffSelector branchId={branchId} />

          {/* 🔥 RECURRENCIA */}
          <div className="space-y-2">
            <Label>Repetición</Label>

            <div className="space-y-2">
              <RecurrenceSelector
                value={state.recurrenceType}
                onChange={(v) => setField("recurrenceType", v)}
              />
            </div>
          </div>

          {/* WEEKLY */}
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
                        active ? "bg-black text-white border-black" : "bg-white"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* DAILY / MONTHLY INFO */}
          {state.recurrenceType === "DAILY" && (
            <p className="text-sm text-muted-foreground">
              Se repetirá todos los días
            </p>
          )}

          {state.recurrenceType === "MONTHLY" && (
            <p className="text-sm text-muted-foreground">
              Se repetirá cada mes en este día
            </p>
          )}

          {/* RANGE */}
          {state.recurrenceType !== "NONE" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Desde</Label>
                <DateSelector
                  value={state.startDate}
                  onChange={(d) => setField("startDate", d)}
                />
              </div>

              <div className="space-y-2">
                <Label>Hasta</Label>
                <DateSelector
                  value={state.endDate}
                  onChange={(d) => setField("endDate", d)}
                />
              </div>
            </div>
          )}

          {/* MOTIVO */}
          <div className="space-y-2">
            <Label>Motivo</Label>
          <Input
            placeholder="Motivo..."
            value={state.reason}
            onChange={(e) => setField("reason", e.target.value)}
            className="shadow-none py-6"
          />
          </div>
        </div>

        {/* ACTIONS */}
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
