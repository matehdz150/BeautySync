"use client";

import { useState } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { DateTime } from "luxon";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
  value: string; // "HH:mm"
  onChange: (time: string) => void;
  step?: number; // minutos (default 15)
};

export function TimePickerInput({
  value,
  onChange,
  step = 15,
}: Props) {
  const [open, setOpen] = useState(false);

  // generar slots (6:00 → 23:45)
  const times = [];
  for (let h = 6; h < 24; h++) {
    for (let m = 0; m < 60; m += step) {
      const t = DateTime.fromObject({ hour: h, minute: m }).toFormat("HH:mm");
      times.push(t);
    }
  }

  const formatted = value
    ? DateTime.fromFormat(value, "HH:mm").toFormat("HH:mm")
    : "Seleccionar";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between py-5 font-normal shadow-none"
        >
          <span>{formatted}</span>
          <ChevronDown className="w-4 h-4 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-40 p-2 max-h-60 overflow-y-auto">
        <div className="flex flex-col gap-1">
          {times.map((t) => (
            <button
              key={t}
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className={`text-sm px-2 py-1 rounded hover:bg-gray-100 text-left ${
                t === value ? "bg-gray-200 font-medium" : ""
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}