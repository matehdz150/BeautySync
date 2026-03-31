"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

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
} from "@/components/ui/command";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { useBranch } from "@/context/BranchContext";
import { useCouponDraft } from "@/context/CouponDraftContext";

import { getServicesByBranch } from "@/lib/services/services";

export interface Service {
  id: string;
  name: string;
  priceCents?: number;
}

export function CouponServicesSelect() {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const { branch } = useBranch();
  const { draft, update } = useCouponDraft();

  const selectedIds = draft.serviceIds ?? [];

  // =========================
  // LOAD SERVICES
  // =========================
  useEffect(() => {
    if (!branch?.id) return;

    async function load() {
      try {
        setLoading(true);
        const data = await getServicesByBranch(branch.id);
        setServices(data);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [branch?.id]);

  // =========================
  // HANDLERS
  // =========================
  function toggleService(id: string) {
    if (selectedIds.includes(id)) {
      update({
        serviceIds: selectedIds.filter((s) => s !== id),
      });
    } else {
      update({
        serviceIds: [...selectedIds, id],
      });
    }
  }

  function removeService(id: string) {
    update({
      serviceIds: selectedIds.filter((s) => s !== id),
    });
  }

  // =========================
  // SELECTED OBJECTS
  // =========================
  const selectedServices = services.filter((s) =>
    selectedIds.includes(s.id)
  );

  return (
    <div className="flex flex-col gap-3">
      <Label>Servicios (opcional)</Label>

      {/* SELECT */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full min-h-[56px] justify-between px-3 shadow-none"
          >
            {selectedServices.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedServices.map((s) => (
                  <Badge
                    key={s.id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {s.name}

                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeService(s.id);
                      }}
                    />
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">
                Seleccionar servicios…
              </span>
            )}

            <ChevronsUpDown className="w-4 h-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[360px] p-0">
          <Command>
            <div className="p-3">
              <CommandInput placeholder="Buscar servicio..." />
            </div>

            <CommandList>
              {loading ? (
                <div className="p-4 text-sm">Cargando...</div>
              ) : (
                <CommandGroup>
                  {services.map((s) => {
                    const selected = selectedIds.includes(s.id);

                    return (
                      <CommandItem
                        key={s.id}
                        onSelect={() => toggleService(s.id)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col text-sm">
                            <span>{s.name}</span>

                            {s.priceCents && (
                              <span className="text-xs text-muted-foreground">
                                ${s.priceCents / 100}
                              </span>
                            )}
                          </div>

                          <Check
                            className={cn(
                              "h-4 w-4",
                              selected ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <p className="text-xs text-muted-foreground">
        Si no seleccionas servicios, el cupón aplicará a todos.
      </p>
    </div>
  );
}