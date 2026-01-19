"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  Grid2X2,
  Scissors,
  Sparkles,
  Eye,
  Flame,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

type Category = {
  id: string;
  label: string;
  icon: React.ElementType;
};

const FEATURED: Category[] = [
  { id: "all", label: "Todos los tratamientos", icon: Grid2X2 },
  { id: "hair", label: "Cabello y peinado", icon: Scissors },
  { id: "nails", label: "Salones de uñas", icon: Sparkles },
  { id: "wax", label: "Depilación", icon: Flame },
  { id: "brows", label: "Cejas y pestañas", icon: Eye },
];

export function SearchWithDropdown() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const placeholder = useMemo(() => {
    return "Fade perfecto, uñas gel, facial, spa… lo que te pida el mood ✨";
  }, []);

  function onSearch(value?: string) {
    const finalQuery = (value ?? query).trim();
    const params = new URLSearchParams();
    if (finalQuery) params.set("q", finalQuery);

    setOpen(false);
    router.push(`/explore/results?${params.toString()}`);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* Trigger estable */}
        <div
          className={cn(
            "rounded-full border border-black/10 bg-white transition cursor-text",
            "hover:shadow-md",
            "focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/20"
          )}
          onClick={() => setOpen(true)}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex items-center gap-3 flex-1 px-2">
              <Search className="w-5 h-5 text-black/35" />

              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  // 👇 IMPORTANTÍSIMO: siempre mantener abierto mientras escribe
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                className="w-full bg-transparent outline-none text-base placeholder:text-black/30"
              />
            </div>

            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSearch();
              }}
              className="rounded-full px-7 py-6 text-base shadow-none"
            >
              Buscar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={10}
        className={cn(
          "w-[520px] max-w-[calc(100vw-32px)] p-2",
          "rounded-3xl border border-black/10 bg-white shadow-xl"
        )}
        // 👇 evita que el popover cambie el focus y provoque cierre raro
        onOpenAutoFocus={(e) => e.preventDefault()}
        // 👇 evita que se cierre si interactúas dentro (input/trigger)
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;

          // si clickeas dentro del trigger, NO cierres
          if (target.closest("[data-search-trigger]")) {
            e.preventDefault();
          }
        }}
      >
        {/* este wrapper nos ayuda a detectar "inside trigger" */}
        <div data-search-trigger className="hidden" />

        <Command className="rounded-2xl">
          <CommandList>
            <ScrollArea className="h-[320px] pr-2">
              <CommandGroup heading="Categorías destacadas">
                {FEATURED.map((item) => {
                  const Icon = item.icon;

                  return (
                    <CommandItem
                      key={item.id}
                      value={item.label}
                      onSelect={() => onSearch(item.label)}
                      className={cn(
                        "flex items-center gap-4 rounded-2xl px-3 py-3 cursor-pointer",
                        "aria-selected:bg-indigo-500/5"
                      )}
                    >
                      <div className="h-11 w-11 rounded-xl border border-black/10 bg-white flex items-center justify-center">
                        <Icon className="w-5 h-5 text-indigo-500" />
                      </div>

                      <p className="text-[15px] font-medium text-black">
                        {item.label}
                      </p>
                    </CommandItem>
                  );
                })}
              </CommandGroup>

              <CommandSeparator className="my-2" />

              <CommandGroup heading="Ideas rápidas">
                {["Corte ejecutivo", "Uñas gel", "Facial glow", "Spa para resetear"].map(
                  (x) => (
                    <CommandItem
                      key={x}
                      value={x}
                      onSelect={() => onSearch(x)}
                      className="rounded-2xl px-3 py-2 cursor-pointer aria-selected:bg-indigo-500/5"
                    >
                      <span className="text-sm">{x}</span>
                    </CommandItem>
                  )
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}