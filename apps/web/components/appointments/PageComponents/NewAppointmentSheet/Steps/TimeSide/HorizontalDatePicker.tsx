"use client";

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: Date;
  onChange: (date: Date) => void;
};

const PAGE_SIZE = 5;
const MONTHS_AHEAD = 3;

export function HorizontalDatePicker({ value, onChange }: Props) {
  /* =====================
     RANGE
  ===================== */

  const rangeStart = useMemo(() => startOfMonth(value), [value]);
  const rangeEnd = useMemo(
    () => endOfMonth(addMonths(rangeStart, MONTHS_AHEAD - 1)),
    [rangeStart]
  );

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: rangeStart,
        end: rangeEnd,
      }),
    [rangeStart, rangeEnd]
  );

  /* =====================
     PAGINATION
  ===================== */

  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    setStartIndex(0);
  }, [rangeStart.getTime()]);

  const maxStart = Math.max(days.length - PAGE_SIZE, 0);
  const canPrev = startIndex > 0;
  const canNext = startIndex < maxStart;

  const visibleDays = days.slice(startIndex, startIndex + PAGE_SIZE);

  const headerLabel = format(value, "MMMM", {
    locale: es,
  });

  /* =====================
     RENDER
  ===================== */

  return (
    <div className="w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold capitalize">{headerLabel}</h2>

        <div className="flex items-center gap-2">
          <button
            disabled={!canPrev}
            onClick={() =>
              setStartIndex((i) => Math.max(i - PAGE_SIZE, 0))
            }
            className="h-8 w-8 rounded-full flex items-center justify-center
              hover:bg-black/5 disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            disabled={!canNext}
            onClick={() =>
              setStartIndex((i) =>
                Math.min(i + PAGE_SIZE, maxStart)
              )
            }
            className="h-8 w-8 rounded-full flex items-center justify-center
              hover:bg-black/5 disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* DAYS */}
      <div className="flex gap-4">
        {visibleDays.map((day) => {
          const selected = isSameDay(day, value);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onChange(day)}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={cn(
                  "h-20 w-20 rounded-full flex flex-col items-center justify-center transition p-12",
                  selected
                    ? "bg-indigo-400 text-white"
                    : "border border-black/15 text-black"
                )}
              >
                <span
                  className={cn(
                    "text-sm",
                    selected ? "opacity-90" : "text-black/60"
                  )}
                >
                  {format(day, "EEE", { locale: es })}
                </span>

                <span className="text-3xl font-semibold">
                  {format(day, "d")}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}