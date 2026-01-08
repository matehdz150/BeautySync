"use client";

import { useMemo, useState } from "react";
import { ChevronsUpDown, Check } from "lucide-react";

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
  CommandItem,
  CommandGroup,
  CommandEmpty,
} from "@/components/ui/command";

import { CategoryIcon } from "../../shared/Icon";
import { cn } from "@/lib/utils";

export type Category = {
  id: string;
  name: string;
  icon?: string;
  colorHex?: string;
};

export function CategoryPicker({
  categories,
  value,
  onChange,
  label = "Categoría",
  externalOpen,
  onOpenChange,
}: {
  categories: Category[];
  value?: string | null;
  onChange: (id: string) => void;
  label?: string;
  externalOpen?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  const realOpen = externalOpen ?? open;
  const setRealOpen = onOpenChange ?? setOpen;
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const selected = categories.find(c => c.id === value);
  const suggested = categories.slice(0, 4);

  const filtered = useMemo(() => {
    if (!filterTag) return categories;
    return categories.filter(
      c => c.id === filterTag || c.name.includes(filterTag)
    );
  }, [categories, filterTag]);

  return (
    <div className="space-y-2">
      {/* Label arriba — mismo estilo */}
      <Label className="text-sm font-medium text-gray-800">
        {label}
      </Label>

      <Popover open={realOpen} onOpenChange={setRealOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full h-14 justify-between rounded-md px-3",
              "bg-white border text-left shadow-none",
              !selected && "text-gray-500"
            )}
          >
            {selected ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: (selected.colorHex ?? "#e5e7eb") + "33",
                  }}
                >
                  <CategoryIcon
                    name={selected.icon}
                    className="w-4 h-4"
                  />
                </div>

                <span className="text-[13px]">
                  {selected.name}
                </span>
              </div>
            ) : (
              "Seleccionar categoría"
            )}

            <ChevronsUpDown className="w-4 h-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-115 p-0 rounded-2xl shadow-lg"
        >
          <Command shouldFilter={false}>
            <div className="p-3">
              <CommandInput placeholder="Buscar categoría…" autoFocus />
            </div>

            <div className="px-3 pt-3 flex gap-2 flex-wrap">
              {suggested.map(c => (
                <button
                  key={c.id}
                  onClick={() =>
                    setFilterTag(c.id === filterTag ? null : c.id)
                  }
                  className={cn(
                    "px-3 h-8 rounded-full border text-sm flex items-center gap-1",
                    c.id === filterTag
                      ? "bg-black text-white border-black"
                      : "hover:bg-gray-100"
                  )}
                >
                  <CategoryIcon name={c.icon} className="w-4 h-4" />
                  {c.name}
                </button>
              ))}
            </div>

            <div
              className="max-h-60 overflow-y-auto mt-2"
              onWheel={e => e.stopPropagation()}
            >
              <CommandList>
                <CommandEmpty>No hay categorías</CommandEmpty>

                <CommandGroup>
                  {filtered.map(c => (
                    <CommandItem
                      key={c.id}
                      value={c.name}
                      onSelect={() => {
                        onChange(c.id);
                        setOpen(false);
                      }}
                      className="py-2"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{
                            background: (c.colorHex ?? "#e5e7eb") + "55",
                          }}
                        >
                          <CategoryIcon
                            name={c.icon}
                            className="w-4 h-4"
                          />
                        </div>

                        <span>{c.name}</span>
                      </div>

                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === c.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </div>

            <div className="px-3 py-2 text-xs text-gray-500 border-t">
              {filtered.length} resultados
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}