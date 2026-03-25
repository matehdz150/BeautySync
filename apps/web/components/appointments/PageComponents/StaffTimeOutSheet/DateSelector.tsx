"use client";

import { useState } from "react";
import { DateTime } from "luxon";
import { CalendarIcon, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
  value: string; // ISO: YYYY-MM-DD
  onChange: (date: string) => void;
};

export function DateSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const date = value ? DateTime.fromISO(value) : null;

  const formatted = date
    ? date.setLocale("es").toFormat("ccc dd LLL")
    : "Selecciona fecha";

  const pretty =
    formatted.charAt(0).toUpperCase() + formatted.slice(1);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between py-6 font-normal shadow-none"
        >
          <span>{pretty}</span>
          <ChevronDown className="w-4 h-4 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date?.toJSDate()}
          onSelect={(d) => {
            if (!d) return;

            const iso = DateTime.fromJSDate(d).toISODate();
            onChange(iso!);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}