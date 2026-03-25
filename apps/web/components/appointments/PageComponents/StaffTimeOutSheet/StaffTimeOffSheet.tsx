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
import {
  createStaffTimeOff,
  getTimeOffEndSlots,
  getTimeOffStartSlots,
  updateStaffTimeOff,
} from "@/lib/services/staff-time-off";

import { StaffSelector } from "./StaffSelector";
import { DateSelector } from "./DateSelector";
import { TimePickerInput } from "./TimeSelector";
import { RecurrenceSelector } from "./RecurrenceSelector";
import { Input } from "@/components/ui/input";
import { DateTime } from "luxon";

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
  const { setField, toggleDay } = useTimeOffActions();
  console.log(state.isEdit);

  const [loading, setLoading] = useState(false);
  const [startSlots, setStartSlots] = useState<string[]>([]);
  const [endSlots, setEndSlots] = useState<string[]>([]);

  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingEnd, setLoadingEnd] = useState(false);

  function isoToTime(iso: string) {
    return DateTime.fromISO(iso)
      .setZone("America/Mexico_City")
      .toFormat("HH:mm");
  }

  function timeToISO(date: string, time: string) {
    const [h, m] = time.split(":").map(Number);

    return DateTime.fromISO(date).set({ hour: h, minute: m }).toUTC().toISO();
  }

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

  useEffect(() => {
    if (!state.staffId || !state.date) return;

    async function load() {
      setLoadingStart(true);

      try {
        const res = await getTimeOffStartSlots({
          branchId,
          staffId: state.staffId,
          date: state.date,
        });

        setStartSlots(res.slots);
      } catch (e) {
        console.error(e);
        setStartSlots([]);
      } finally {
        setLoadingStart(false);
      }
    }

    load();
  }, [state.staffId, state.date]);

  useEffect(() => {
    if (!state.staffId || !state.date || !state.startTime) {
      setEndSlots([]);
      return;
    }

    async function load() {
      setLoadingEnd(true);

      try {
        const startISO = timeToISO(state.date, state.startTime);

        const res = await getTimeOffEndSlots({
          branchId,
          staffId: state.staffId,
          date: state.date,
          startISO: startISO!,
        });

        setEndSlots(res.endSlots);
      } catch (e) {
        console.error(e);
        setEndSlots([]);
      } finally {
        setLoadingEnd(false);
      }
    }

    load();
  }, [state.startTime]);

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

      if (state.isEdit && state.timeOffId) {
        // 🔥 UPDATE
        if (!state.timeOffId) {
          throw new Error("Missing timeOffId for update");
        }
        await updateStaffTimeOff({
          timeOffId: state.timeOffId,
          ...payload,
        });
      } else {
        // 🔥 CREATE
        await createStaffTimeOff(payload);
      }

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

  const noStaff = !state.staffId;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full !max-w-[32rem] bg-white flex flex-col h-[100dvh] p-0">
        <SheetHeader className="px-6 py-5 border-b text-left">
          <SheetTitle>
            {state.isEdit ? "Editar bloqueo" : "Bloquear horario"}
          </SheetTitle>
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
                onChange={(t) => {
                  setField("startTime", t);
                  setField("endTime", "");
                }}
                options={startSlots.map(isoToTime)}
                loading={loadingStart}
                disabled={!state.staffId}
                emptyMessage="Selecciona un staff primero"
              />
              {noStaff && (
                <p className="text-xs text-muted-foreground">
                  Selecciona un staff para ver disponibilidad
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Hora fin</Label>
              <TimePickerInput
                value={state.endTime}
                onChange={(t) => setField("endTime", t)}
                options={endSlots.map(isoToTime)}
                loading={loadingEnd}
                disabled={!state.staffId}
                emptyMessage="Selecciona un staff primero"
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
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-6"
          >
            {loading
              ? "Guardando..."
              : state.isEdit
                ? "Guardar cambios"
                : "Guardar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
