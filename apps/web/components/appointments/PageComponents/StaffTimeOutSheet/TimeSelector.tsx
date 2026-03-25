"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
  value: string;
  onChange: (time: string) => void;

  options: string[];
  loading?: boolean;
  placeholder?: string;

  disabled?: boolean;
  emptyMessage?: string;
};

export function TimePickerInput({
  value,
  onChange,
  options,
  loading = false,
  placeholder = "Seleccionar",
  disabled = false,
  emptyMessage = "Sin disponibilidad",
}: Props) {
  const [open, setOpen] = useState(false);

  const display = value || placeholder;

  return (
    <Popover
      open={open && !disabled}
      onOpenChange={setOpen}
      modal={false}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="w-full justify-between py-5 font-normal shadow-none"
        >
          <span className={!value ? "text-muted-foreground" : ""}>
            {display}
          </span>
          <ChevronDown className="w-4 h-4 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={4}
        avoidCollisions={false}
        className="w-[var(--radix-popover-trigger-width)] p-0 overflow-hidden pointer-events-auto"
      >
        <div
          className="max-h-[300px] overflow-y-auto p-2"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* 🔥 NO STAFF */}
          {disabled && (
            <p className="text-sm text-muted-foreground px-2 py-2">
              {emptyMessage}
            </p>
          )}

          {/* 🔥 LOADING */}
          {!disabled && loading && (
            <p className="text-sm text-muted-foreground px-2 py-2">
              Cargando horarios...
            </p>
          )}

          {/* 🔥 EMPTY */}
          {!disabled && !loading && options.length === 0 && (
            <p className="text-sm text-muted-foreground px-2 py-2">
              Sin disponibilidad
            </p>
          )}

          {/* 🔥 OPTIONS */}
          {!disabled && !loading && options.length > 0 && (
            <div className="flex flex-col gap-1">
              {options.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    onChange(t);
                    setOpen(false);
                  }}
                  className={`text-sm px-2 py-2 rounded-md text-left transition ${
                    t === value
                      ? "bg-gray-200 font-medium"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}