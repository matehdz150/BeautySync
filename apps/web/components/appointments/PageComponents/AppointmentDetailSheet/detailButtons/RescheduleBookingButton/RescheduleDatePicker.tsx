"use client";

import { useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* =====================
   TYPES
===================== */

type Props = {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  maxMonthsAhead?: number;
};

/* =====================
   DATE UTILS
===================== */

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function addMonthsClamp(d: Date, months: number) {
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();

  const targetMonth = month + months;
  const first = new Date(year, targetMonth, 1);
  const lastDay = new Date(year, targetMonth + 1, 0).getDate();

  return new Date(
    first.getFullYear(),
    first.getMonth(),
    Math.min(day, lastDay)
  );
}

/* =====================
   COMPONENT
===================== */

export function RescheduleDatePicker({
  value,
  onChange,
  maxMonthsAhead = 3,
}: Props) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const maxDate = useMemo(
    () => addMonthsClamp(today, maxMonthsAhead),
    [today, maxMonthsAhead]
  );

  const initial = value ? new Date(value + "T00:00:00") : today;
  const [windowStart, setWindowStart] = useState(startOfDay(initial));

  /* =====================
     DAYS (7)
  ===================== */

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(windowStart, i);
      const iso = toISODate(date);

      const disabled = date < today || date > maxDate;

      return {
        iso,
        date,
        day: date.getDate(),
        weekday: date.toLocaleDateString("es-MX", { weekday: "short" }),
        disabled,
      };
    });
  }, [windowStart, today, maxDate]);

  /* =====================
     HEADER
  ===================== */

  const headerLabel = useMemo(() => {
    const start = days[0]?.date;
    const end = days[6]?.date;
    if (!start || !end) return "";

    const a = start.toLocaleDateString("es-MX", {
      month: "long",
      year: "numeric",
    });
    const b = end.toLocaleDateString("es-MX", {
      month: "long",
      year: "numeric",
    });

    return a === b ? a : `${a} · ${b}`;
  }, [days]);

  /* =====================
     NAV
  ===================== */

  const canPrev = addDays(windowStart, -7) >= today;
  const canNext = addDays(windowStart, 7) <= maxDate;

  return (
    <div className="space-y-5">
      {/* HEADER */}
      {/* HEADER */}
      <div className="flex items-center justify-between px-2">
        {/* Mes */}
        <p className="text-base font-semibold capitalize">{headerLabel}</p>

        {/* Acciones */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => canPrev && setWindowStart(addDays(windowStart, -7))}
            disabled={!canPrev}
            className={cn(
              "p-2 rounded-full transition",
              canPrev
                ? "hover:bg-gray-100 text-gray-700"
                : "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => canNext && setWindowStart(addDays(windowStart, 7))}
            disabled={!canNext}
            className={cn(
              "p-2 rounded-full transition",
              canNext
                ? "hover:bg-gray-100 text-gray-700"
                : "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Calendario (acción secundaria) */}
          <button
            type="button"
            className="ml-1 p-2 rounded-full text-black border"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DAYS */}
      <div className="pb-5">
        <div className="flex justify-between gap-2">
          {days.map((d) => {
            const selected = value === d.iso;

            return (
              <button
                key={d.iso}
                disabled={d.disabled}
                onClick={() => onChange(d.iso)}
                className={cn(
                  "flex flex-col items-center justify-center",
                  "w-10 h-10 rounded-full border transition px-7 py-7",
                  selected && "bg-indigo-400 text-white border-indigo-400",
                  !selected &&
                    !d.disabled &&
                    "bg-white border-gray-200 hover:bg-gray-100",
                  d.disabled && "opacity-40 cursor-not-allowed"
                )}
              >
                <span className="text-xs capitalize">{d.weekday}</span>
                <span className="text-sm font-semibold leading-none">
                  {d.day}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
