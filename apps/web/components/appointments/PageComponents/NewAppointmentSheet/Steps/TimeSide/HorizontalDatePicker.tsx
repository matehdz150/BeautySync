"use client";

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
} from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

type Props = {
  value: Date;
  onChange: (date: Date) => void;
};

// cuántos días avanzan las flechas
const PAGE_SIZE = 6;
// cuántos meses hacia adelante cargamos en la tira
const MONTHS_AHEAD = 3;

export function HorizontalDatePicker({ value, onChange }: Props) {
  // anclamos el rango en el mes de la fecha actual
  const rangeStart = useMemo(() => startOfMonth(value), [value]);
  const rangeEnd = useMemo(
    () => endOfMonth(addMonths(rangeStart, MONTHS_AHEAD - 1)),
    [rangeStart]
  );

  // todos los días del rango (p.ej. enero-marzo)
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: rangeStart,
        end: rangeEnd,
      }),
    [rangeStart, rangeEnd]
  );

  // índice del primer día visible
  const [startIndex, setStartIndex] = useState(0);

  // cuando cambia de “mes base” (value), reseteamos al inicio del rango
  useEffect(() => {
    setStartIndex(0);
  }, [rangeStart.getTime()]);

  const maxStart = Math.max(days.length - PAGE_SIZE, 0);
  const canGoPrev = startIndex > 0;
  const canGoNext = startIndex < maxStart;

  const visibleDays = days.slice(startIndex, startIndex + PAGE_SIZE);

  // título usando el mes del primer día visible (se irá moviendo)
  const headerLabel = format(visibleDays[0] ?? value, "MMMM yyyy");

  return (
    <div className="inline-flex flex-col gap-4 p-2 rounded-xl bg-white max-w-120">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-sm leading-none truncate">
          {headerLabel}
        </h3>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() =>
              setStartIndex((prev) => Math.max(prev - PAGE_SIZE, 0))
            }
            className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={!canGoNext}
            onClick={() =>
              setStartIndex((prev) =>
                Math.min(prev + PAGE_SIZE, maxStart)
              )
            }
            className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
            onClick={() => alert("TODO abrir calendario")}
          >
            <Calendar className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* DAYS ROW */}
      <div className="relative w-full">
        <div
          className="
            flex gap-6
            w-full
            overflow-x-auto
            overflow-y-hidden
            no-scrollbar
            pb-2
            snap-x snap-mandatory
          "
        >
          {visibleDays.map((day) => {
            const selected = isSameDay(day, value);
            const weekend = [0, 6].includes(day.getDay());

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onChange(day)}
                className="flex flex-col items-center gap-1 min-w-12.5 snap-start pl-6"
              >
                <div
                  className={`
                    h-15 w-15 rounded-full flex items-center justify-center text-sm border
                    ${
                      selected
                        ? "bg-indigo-400 text-white"
                        : "bg-white text-gray-800"
                    }
                    ${weekend && !selected ? "opacity-50" : ""}
                  `}
                >
                  {format(day, "d")}
                </div>

                <span className="text-[10px] text-gray-500">
                  {format(day, "EEE")}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}