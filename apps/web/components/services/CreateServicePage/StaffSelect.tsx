"use client";

import { useState } from "react";
import { ChevronsUpDown, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Staff = {
  id: string;
  name: string;
  photoUrl?: string;
};

export function StaffSelect({
  staff = [],
  value = [],
  onChange,
  label = "Asignar staff",
  placeholder = "Seleccionar staff…",
}: {
  staff: Staff[];
  value?: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const safeStaff = staff ?? [];
  const safeValue = value ?? []; // ⬅️  SIEMPRE ARRAY

  const suggested = safeStaff.slice(0, 3);

  function toggle(id: string) {
    if (safeValue.includes(id)) {
      onChange(safeValue.filter((v) => v !== id));
    } else {
      onChange([...safeValue, id]);
    }
  }

  const selectedStaff = safeStaff.filter((s) => safeValue.includes(s.id));

  return (
    <div className="space-y-2 mt-2">
      <Label className="mb-2">{label}</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-14 justify-between rounded-md px-3 shadow-none"
          >
            {selectedStaff.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {selectedStaff.slice(0, 2).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-1 px-2 py-1 rounded-full border text-xs"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={s.photoUrl ?? ""} />
                      <AvatarFallback className="bg-indigo-100">{s.name[0]}</AvatarFallback>
                    </Avatar>

                    {s.name}

                    <X
                      className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(s.id);
                      }}
                    />
                  </div>
                ))}

                {/* 👇 RESUMEN */}
                {selectedStaff.length > 2 && (
                  <div className="flex items-center px-2 py-1 rounded-full border bg-muted text-xs">
                    +{selectedStaff.length - 2} más
                  </div>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}

            <ChevronsUpDown className="w-4 h-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[360px] p-0">
          <Command>
            <div className="p-3">
              <CommandInput placeholder="Buscar staff..." />
            </div>

            <div className="px-3 pb-2 flex flex-wrap gap-2">
              {suggested.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={cn(
                    "px-3 h-8 rounded-full border text-sm flex items-center gap-2 hover:bg-muted",
                    safeValue.includes(s.id) && "bg-muted border-primary"
                  )}
                >
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={s.photoUrl ?? ""} />
                    <AvatarFallback className="bg-indigo-100">{s.name[0]}</AvatarFallback>
                  </Avatar>

                  {s.name}
                </button>
              ))}
            </div>

            <div className="max-h-[240px] overflow-y-auto">
              <CommandList>
                <CommandEmpty>No staff found</CommandEmpty>

                <CommandGroup>
                  {safeStaff.map((s) => (
                    <CommandItem
                      key={s.id}
                      className="py-2"
                      onSelect={() => toggle(s.id)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={s.photoUrl ?? ""} />
                          <AvatarFallback className="bg-indigo-100">{s.name[0]}</AvatarFallback>
                        </Avatar>

                        {s.name}
                      </div>

                      <Check
                        className={cn(
                          "h-4 w-4",
                          safeValue.includes(s.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </div>

            <div className="px-3 py-2 text-xs text-muted-foreground border-t">
              {safeValue.length} seleccionados
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
