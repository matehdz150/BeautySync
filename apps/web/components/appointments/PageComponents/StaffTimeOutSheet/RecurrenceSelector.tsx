"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Command, CommandGroup, CommandItem } from "@/components/ui/command";

import { cn } from "@/lib/utils";

type RecurrenceType = "NONE" | "DAILY" | "WEEKLY";

const OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: "NONE", label: "Sin repetición" },
  { value: "DAILY", label: "Cada dia" },
  { value: "WEEKLY", label: "Cada semana" },
];

type Props = {
  value: RecurrenceType;
  onChange: (v: RecurrenceType) => void;
};

export function RecurrenceSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const selected = OPTIONS.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between shadow-none py-6 font-normal"
        >
          {selected?.label ?? "Seleccionar"}
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
      >
        <Command>
          <CommandGroup>
            {OPTIONS.map((opt) => (
              <CommandItem
                key={opt.value}
                onSelect={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="flex items-center justify-between w-full"
              >
                {opt.label}

                <Check
                  className={cn(
                    "w-4 h-4",
                    value === opt.value ? "opacity-100" : "opacity-0",
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
