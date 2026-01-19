"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStaffDraft } from "@/context/StaffDraftContext";

/* =========================
   CONSTS
========================= */

const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const DAY_TO_INDEX: Record<string, number> = {
  Domingo: 0,
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
};

const HOURS = Array.from(
  { length: 24 },
  (_, i) => `${String(i).padStart(2, "0")}:00`
);

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getValidStartHours(minTime?: string) {
  if (!minTime) return HOURS;

  const min = toMinutes(minTime);

  return HOURS.filter((h) => toMinutes(h) >= min);
}

function getValidEndHours(startTime: string) {
  const start = toMinutes(startTime);

  return HOURS.filter((h) => toMinutes(h) > start);
}

function addHours(time: string, hours: number) {
  const [h, m] = time.split(":").map(Number);
  const newHour = Math.min(h + hours, 23);
  return `${String(newHour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/* =========================
   PAGE
========================= */

export default function SchedulePage() {
  const { state, dispatch } = useStaffDraft();

  /* =========================
     BUILD UI STATE FROM CONTEXT
  ========================= */

  const scheduleByDay = Object.fromEntries(
    DAYS.map((day) => {
      const dayIndex = DAY_TO_INDEX[day];
      const blocks = state.schedules.filter((s) => s.dayOfWeek === dayIndex);

      return [
        day,
        {
          enabled: blocks.length > 0,
          blocks,
        },
      ];
    })
  );

  /* =========================
     HANDLERS
  ========================= */

  function toggleDay(day: string, enabled: boolean) {
    const dayIndex = DAY_TO_INDEX[day];

    if (!enabled) {
      dispatch({ type: "CLEAR_DAY", payload: dayIndex });
    } else {
      dispatch({
        type: "ADD_SCHEDULE",
        payload: {
          staffId: "draft",
          dayOfWeek: dayIndex,
          startTime: "10:00",
          endTime: "19:00",
        },
      });
    }
  }

  function updateRange(
    blockIndex: number,
    key: "startTime" | "endTime",
    value: string
  ) {
    dispatch({
      type: "UPDATE_SCHEDULE",
      payload: {
        index: blockIndex,
        data: { [key]: value },
      },
    });
  }

  function addRange(day: string) {
    const dayIndex = DAY_TO_INDEX[day];

    const blocks = state.schedules
      .filter((s) => s.dayOfWeek === dayIndex)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (blocks.length === 0) return;

    const last = blocks[blocks.length - 1];

    const newStart = last.endTime;
    const newEnd = addHours(newStart, 2); // duración default

    // ❌ No hay espacio
    if (newStart >= "23:00") return;

    dispatch({
      type: "ADD_SCHEDULE",
      payload: {
        staffId: "draft",
        dayOfWeek: dayIndex,
        startTime: newStart,
        endTime: newEnd,
      },
    });
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="max-w-3xl mx-auto px-6 py-2 space-y-10 overflow-y-auto pb-20">
      {/* HEADER */}
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold">Horarios</h1>
        <p className="text-muted-foreground">
          Define los horarios en los que el staff acepta citas.
        </p>
      </header>

      {/* CARD */}
      <div className="bg-white rounded-2xl border divide-y">
        {DAYS.map((day) => {
          const dayData = scheduleByDay[day];
          const dayIndex = DAY_TO_INDEX[day];

          return (
            <div key={day} className="flex items-start gap-6 px-6 py-5">
              {/* DAY */}
              <div className="flex items-center gap-3 w-40">
                <Checkbox
                  checked={dayData.enabled}
                  onCheckedChange={(v) => toggleDay(day, !!v)}
                />
                <span className="font-medium">{day}</span>
              </div>

              {/* RANGES */}
              <div className="flex-1 space-y-3">
                {dayData.blocks.map((block, i) => {
                  const globalIndex = state.schedules.findIndex(
                    (s) => s === block
                  );

                  const prevBlock = dayData.blocks[i - 1];
                  const minStart = prevBlock?.endTime;

                  return (
                    <div
                      key={globalIndex}
                      className={cn(
                        "flex items-center gap-3",
                        !dayData.enabled && "opacity-50 pointer-events-none"
                      )}
                    >
                      {/* START */}
                      <Select
                        value={block.startTime}
                        onValueChange={(v) =>
                          updateRange(globalIndex, "startTime", v)
                        }
                      >
                        <SelectTrigger className="w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getValidStartHours(minStart).map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <span className="text-muted-foreground">—</span>

                      {/* END */}
                      <Select
                        value={block.endTime}
                        onValueChange={(v) =>
                          updateRange(globalIndex, "endTime", v)
                        }
                      >
                        <SelectTrigger className="w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getValidEndHours(block.startTime).map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => addRange(day)}
                        className="text-indigo-500 hover:text-indigo-600"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
