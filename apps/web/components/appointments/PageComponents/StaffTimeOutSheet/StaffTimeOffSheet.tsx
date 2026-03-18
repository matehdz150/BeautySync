"use client";

import { useMemo, useState } from "react";
import { DateTime } from "luxon";

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

type RecurrenceType = "NONE" | "DAILY" | "WEEKLY";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  staffId: string;
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
  staffId,
  startISO,
}: Props) {
  const startDefault = startISO ? DateTime.fromISO(startISO) : DateTime.now();

  const [loading, setLoading] = useState(false);

  // instancia simple
  const [date, setDate] = useState(startDefault.toISODate()!);
  const [startTime, setStartTime] = useState(startDefault.toFormat("HH:mm"));
  const [endTime, setEndTime] = useState(
    startDefault.plus({ hours: 1 }).toFormat("HH:mm"),
  );
  const [reason, setReason] = useState("");

  // rules
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("WEEKLY");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([
    startDefault.weekday === 7 ? 0 : startDefault.weekday,
  ]);
  const [ruleStartDate, setRuleStartDate] = useState(startDefault.toISODate()!);
  const [ruleEndDate, setRuleEndDate] = useState(
    startDefault.plus({ months: 1 }).toISODate()!,
  );

  const preview = useMemo(() => {
    if (!isRecurring) {
      return `${date} · ${startTime} - ${endTime}`;
    }

    if (recurrenceType === "DAILY") {
      return `Todos los días · ${startTime} - ${endTime}`;
    }

    return `Semanal · ${daysOfWeek.length} día(s) · ${startTime} - ${endTime}`;
  }, [isRecurring, recurrenceType, daysOfWeek.length, date, startTime, endTime]);

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit() {
    if (loading) return;

    if (!isRecurring) {
      const start = DateTime.fromISO(`${date}T${startTime}`);
      const end = DateTime.fromISO(`${date}T${endTime}`);

      if (!start.isValid || !end.isValid) {
        alert("Fecha u hora inválida");
        return;
      }

      if (end <= start) {
        alert("La hora de fin debe ser mayor que la hora de inicio");
        return;
      }

      setLoading(true);
      try {
        const payload = {
          staffId,
          start: start.toISO()!,
          end: end.toISO()!,
          reason: reason || undefined,
        };

        console.log("create staff time off", payload);

        onOpenChange(false);
      } catch (e) {
        console.error(e);
        alert("No se pudo guardar el bloqueo");
      } finally {
        setLoading(false);
      }

      return;
    }

    if (recurrenceType === "WEEKLY" && daysOfWeek.length === 0) {
      alert("Selecciona al menos un día");
      return;
    }

    const start = DateTime.fromISO(`${ruleStartDate}T${startTime}`);
    const end = DateTime.fromISO(`${ruleStartDate}T${endTime}`);

    if (!start.isValid || !end.isValid) {
      alert("Hora inválida");
      return;
    }

    if (end <= start) {
      alert("La hora de fin debe ser mayor que la hora de inicio");
      return;
    }

    const ruleStart = DateTime.fromISO(ruleStartDate);
    const ruleEnd = DateTime.fromISO(ruleEndDate);

    if (!ruleStart.isValid || !ruleEnd.isValid) {
      alert("Rango de fechas inválido");
      return;
    }

    if (ruleEnd < ruleStart) {
      alert("La fecha final debe ser posterior a la inicial");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        staffId,
        recurrenceType,
        daysOfWeek: recurrenceType === "WEEKLY" ? daysOfWeek : undefined,
        startTime,
        endTime,
        startDate: ruleStartDate,
        endDate: ruleEndDate,
        reason: reason || undefined,
      };

      console.log("create staff time off rule", payload);

      onOpenChange(false);
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar la regla");
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
            Crea un bloqueo individual o una regla recurrente para este staff.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="rounded-2xl border bg-gray-50 px-4 py-3">
            <p className="text-sm font-medium">Preview</p>
            <p className="text-sm text-muted-foreground mt-1">{preview}</p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
            <Checkbox
              checked={isRecurring}
              onCheckedChange={(v) => setIsRecurring(Boolean(v))}
              id="recurring"
            />
            <Label htmlFor="recurring" className="cursor-pointer">
              Repetir bloqueo
            </Label>
          </div>

          {!isRecurring ? (
            <>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora inicio</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hora fin</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Tipo de repetición</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRecurrenceType("DAILY")}
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      recurrenceType === "DAILY"
                        ? "bg-black text-white border-black"
                        : "bg-white"
                    }`}
                  >
                    Diario
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecurrenceType("WEEKLY")}
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      recurrenceType === "WEEKLY"
                        ? "bg-black text-white border-black"
                        : "bg-white"
                    }`}
                  >
                    Semanal
                  </button>
                </div>
              </div>

              {recurrenceType === "WEEKLY" && (
                <div className="space-y-2">
                  <Label>Días de la semana</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => {
                      const active = daysOfWeek.includes(day.value);

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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora inicio</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hora fin</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Desde</Label>
                  <Input
                    type="date"
                    value={ruleStartDate}
                    onChange={(e) => setRuleStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hasta</Label>
                  <Input
                    type="date"
                    value={ruleEndDate}
                    onChange={(e) => setRuleEndDate(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Motivo</Label>
            <Textarea
              placeholder="Vacaciones, descanso, comida, consulta..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
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