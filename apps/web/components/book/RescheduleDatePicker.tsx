"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPublicAvailableDates } from "@/lib/services/public/availability";

/* =====================
   TYPES
===================== */

type Props = {
  selectedDate?: string;
  onSelect?: (date: string) => void;
  requiredDurationMin: number;
  branchSlug: string;
  maxMonthsAhead?: number;
};

type ApiDay = {
  date: string; // YYYY-MM-DD
  available: boolean;
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

function getMonthKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

/* =====================
   COMPONENT
===================== */

export function RescheduleDatePicker({
  selectedDate,
  onSelect,
  requiredDurationMin,
  branchSlug,
  maxMonthsAhead = 2,
}: Props) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const maxDate = useMemo(
    () => addMonthsClamp(today, maxMonthsAhead),
    [today, maxMonthsAhead]
  );

  const [windowStart, setWindowStart] = useState(today);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const fetchedMonthsRef = useRef<Set<string>>(new Set());

  /* =====================
     FETCH POR MES
  ===================== */

  useEffect(() => {
    if (!requiredDurationMin) return;

    const visibleDates = Array.from({ length: 7 }, (_, i) =>
      addDays(windowStart, i)
    );

    const monthsToFetch = new Set(visibleDates.map((d) => getMonthKey(d)));

    const missingMonths = Array.from(monthsToFetch).filter(
      (m) => !fetchedMonthsRef.current.has(m)
    );

    if (missingMonths.length === 0) return;

    setLoading(true);

    Promise.all(
      missingMonths.map((month) =>
        getPublicAvailableDates({
          slug: branchSlug,
          requiredDurationMin,
          month,
        })
      )
    )
      .then((responses) => {
        const next = new Set(availableDates);

        responses.flat().forEach((d) => {
          if (d.available) next.add(d.date);
        });

        missingMonths.forEach((m) => fetchedMonthsRef.current.add(m));
        setAvailableDates(next);
      })
      .finally(() => setLoading(false));
  }, [windowStart, branchSlug, requiredDurationMin]);

  /* =====================
     DAYS (7)
  ===================== */

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(windowStart, i);
      const iso = toISODate(date);

      const disabled =
        date < today || date > maxDate || !availableDates.has(iso);

      return {
        iso,
        date,
        day: date.getDate(),
        weekday: date.toLocaleDateString("es-MX", { weekday: "short" }),
        disabled,
      };
    });
  }, [windowStart, today, maxDate, availableDates]);

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

  function goPrev() {
    if (!canPrev) return;
    setWindowStart((s) => addDays(s, -7));
    scrollerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }

  function goNext() {
    if (!canNext) return;
    setWindowStart((s) => addDays(s, 7));
    scrollerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }

  /* =====================
     RENDER
  ===================== */

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="font-semibold text-lg capitalize">
          {headerLabel}
          {loading && " · cargando…"}
        </p>

        <div className="flex gap-2">
          <button
            onClick={goPrev}
            disabled={!canPrev}
            className={cn(
              "p-2 rounded-full",
              canPrev ? "hover:bg-gray-100" : "opacity-40"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={goNext}
            disabled={!canNext}
            className={cn(
              "p-2 rounded-full",
              canNext ? "hover:bg-gray-100" : "opacity-40"
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days (horizontal scroll) */}
      <div
        ref={scrollerRef}
        className={cn(
          "flex gap-3 overflow-x-auto scroll-smooth",
          "pb-2 -mx-4 px-4",
          "snap-x snap-mandatory"
        )}
      >
        {days.map((d) => {
          const selected = selectedDate === d.iso;

          return (
            <button
              key={d.iso}
              disabled={d.disabled}
              onClick={() => onSelect?.(d.iso)}
              className={cn(
                "shrink-0 snap-start",
                "w-28 h-28 rounded-full border text-center transition bg-white",
                selected && "bg-indigo-400 text-white border-indigo-400",
                !selected && !d.disabled && "hover:bg-gray-100",
                d.disabled && "opacity-40 cursor-not-allowed"
              )}
            >
              <p className="capitalize text-sm">{d.weekday}</p>
              <p className="text-xl font-semibold">{d.day}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}