"use client";

import * as Popover from "@radix-ui/react-popover";
import {
  addMonths,
  addDays,
  addWeeks,
  format,
  startOfMonth,
  eachDayOfInterval,
  endOfMonth,
  isSameDay,
  isSameMonth,
} from "date-fns";

import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { es } from "date-fns/locale";

type Props = {
  date: Date;
  onChange: (d: Date) => void;
};

export function DualMonthDatePicker({ date, onChange }: Props) {
  const thisMonth = startOfMonth(date);
  const nextMonth = startOfMonth(addMonths(date, 1));
  const months = [thisMonth, nextMonth];

  const formatted = format(date, "EEE d MMM", { locale: es });
  const pretty = formatted.charAt(0).toUpperCase() + formatted.slice(1);

  const quick = [
    { label: "In 1 week", add: 1 },
    { label: "In 2 weeks", add: 2 },
    { label: "In 3 weeks", add: 3 },
    { label: "In 4 weeks", add: 4 },
    { label: "In 5 weeks", add: 5 },
  ];

  return (
    <Popover.Root>
      <div className="flex">
        {/* ⬅ PREV DAY */}
        <Button
          variant="outline"
          className="rounded-l-full rounded-r-none shadow-none"
          onClick={() => onChange(addDays(date, -1))}
        >
          <ChevronLeft />
        </Button>

        {/* 📅 TRIGGER */}
        <Popover.Trigger asChild>
          <Button
            variant="outline"
            className="gap-2 rounded-none border-x-0 shadow-none"
          >
            {pretty}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </Popover.Trigger>

        {/* ➡ NEXT DAY */}
        <Button
          variant="outline"
          className="rounded-r-full rounded-l-none shadow-none"
          onClick={() => onChange(addDays(date, 1))}
        >
          <ChevronRight />
        </Button>
      </div>

      {/* 📌 CALENDAR POPOVER CON ANIMACIÓN */}
      <Popover.Content
        side="bottom"
        align="start"
        sideOffset={8}
        className={cn(
          "z-50 rounded-3xl border bg-white p-6 shadow-xl outline-none space-y-6",
          // animaciones shadcn / radix:
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-out-to-top-2"
        )}
      >
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="rounded-full">
            <ChevronLeft />
          </Button>

          <div className="grid grid-cols-2 gap-10">
            {months.map((m, i) => (
              <div key={i}>
                <h2 className="text-center font-semibold">
                  {format(m, "MMMM yyyy")}
                </h2>

                <div className="grid grid-cols-7 text-xs text-center mt-3 text-muted-foreground">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (d) => (
                      <div key={d}>{d}</div>
                    )
                  )}
                </div>

                <div className="grid grid-cols-7 gap-1 mt-2">
                  {eachDayOfInterval({
                    start: startOfMonth(m),
                    end: endOfMonth(m),
                  }).map((day) => (
                    <button
                      key={String(day)}
                      onClick={() => onChange(day)}
                      className={cn(
                        "h-9 w-9 flex items-center justify-center rounded-full text-sm transition",
                        isSameDay(day, date) &&
                          "bg-indigo-500 text-white shadow",
                        !isSameMonth(day, m) && "opacity-30"
                      )}
                    >
                      {format(day, "d")}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button variant="ghost" className="rounded-full">
            <ChevronRight />
          </Button>
        </div>

        {/* QUICK ACTIONS */}
        <div className="flex gap-2 justify-center">
          {quick.map((q) => (
            <Button
              key={q.label}
              variant="outline"
              className="rounded-full"
              onClick={() => onChange(addWeeks(new Date(), q.add))}
            >
              {q.label}
            </Button>
          ))}

          <Button variant="outline" className="rounded-full">
            More
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
