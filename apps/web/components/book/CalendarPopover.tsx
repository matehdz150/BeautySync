"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
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

type Props = {
  selectedDate?: string;
  onSelect: (iso: string) => void;
};

export function CalendarPopover({ selectedDate, onSelect }: Props) {
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const maxDate = React.useMemo(() => addMonthsClamp(today, 2), [today]);

  const selected = selectedDate
    ? new Date(selectedDate + "T00:00:00")
    : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-14 w-14"
          aria-label="Abrir calendario"
          tooltip='Abrir calendario'
        >
          <CalendarIcon className="h-6 w-6" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (!date) return;
            const iso = date.toISOString().split("T")[0];
            onSelect(iso); // ✅ SOLO por acción del usuario
          }}
          disabled={(date) => date < today || date > maxDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}