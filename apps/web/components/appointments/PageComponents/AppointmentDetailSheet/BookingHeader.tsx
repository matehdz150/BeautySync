"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, User } from "lucide-react";
import { DateTime } from "luxon";
import { getClients } from "@/lib/services/clients";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { AnimatePresence, motion, Variants } from "framer-motion";

type Props = {
  booking: any;
  orgId: string;
  onAssignClient: (clientId: string) => Promise<void>;
};

export function BookingHeader({ booking, orgId, onAssignClient }: Props) {
  const start = DateTime.fromISO(booking.startsAtISO).toLocal();
  const hasClient = !!booking.client;

  const [assigning, setAssigning] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [openPopover, setOpenPopover] = useState(false);

  /* ============================
     Load clients only when needed
  ============================ */
  useEffect(() => {
    if (!assigning) return;

    async function load() {
      const res = await getClients(orgId);
      setClients(res);
    }

    load();
  }, [assigning, orgId]);

  async function handleConfirm() {
    if (!selectedClientId) return;

    setSaving(true);
    try {
      await onAssignClient(selectedClientId);
      setAssigning(false);
      setSelectedClientId(null);
    } finally {
      setSaving(false);
    }
  }

  function getInitials(name?: string) {
    if (!name) return "?";
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  const filteredClients = clients.filter((c) =>
    `${c.name ?? ""} ${c.email ?? ""} ${c.phone ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const selectedClient = selectedClientId
  ? clients.find((c) => c.id === selectedClientId)
  : null;

  return (
    <div className="px-5 py-6 bg-white border-b">
      {/* HEADER ROW */}
      <div className="flex items-center justify-between gap-4">
        {/* LEFT: Avatar + info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-15 w-15">
            {booking.client?.avatarUrl ? (
              <AvatarImage
                src={booking.client.avatarUrl}
                alt={booking.client.name ?? "Cliente"}
              />
            ) : booking.client?.name ? (
              <AvatarFallback className="bg-black text-white text-base font-medium">
                {getInitials(booking.client.name)}
              </AvatarFallback>
            ) : (
              <AvatarFallback className="bg-black text-white flex items-center justify-center">
                <User className="h-5 w-5" />
              </AvatarFallback>
            )}
          </Avatar>

          <div>
            <h2 className="text-base font-semibold">
              {booking.client?.name ?? "Sin cliente"}
            </h2>

            <p className="text-sm text-muted-foreground">
              {start.toFormat("ccc d LLL")} • {start.toFormat("t")}
            </p>
          </div>
        </div>

        {/* RIGHT: Actions */}
        {hasClient ? (
          <Button variant="outline" size="sm">
            Ver cliente
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" onClick={() => setAssigning(true)}>
            Asignar cliente
          </Button>
        )}
      </div>

      {/* ============================
    Assign client UI (shadcn)
============================ */}
      <AnimatePresence>
        {assigning && (
          <motion.div
            key="assign-client"
            variants={assignVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mt-4 rounded-md border bg-[muted/30] p-3 space-y-3 overflow-hidden"
          >
            <Popover open={openPopover} onOpenChange={setOpenPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-white py-5"
                  onClick={() => setOpenPopover(true)}
                >
                  {selectedClient ? (
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0">
                        {selectedClient.avatarUrl ? (
                          <AvatarImage
                            src={selectedClient.avatarUrl}
                            alt={selectedClient.name}
                          />
                        ) : (
                          <AvatarFallback className="bg-black text-white text-xs">
                            {getInitials(selectedClient.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <span className="text-sm font-medium truncate">
                        {selectedClient.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Selecciona un cliente
                    </span>
                  )}

                  <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                </Button>
              </PopoverTrigger>

              <PopoverContent
                side="bottom"
                align="start"
                sideOffset={4}
                className="p-0 w-[var(--radix-popover-trigger-width)]"
              >
                <Command>
                  <CommandInput placeholder="Buscar cliente…" />
                  <CommandEmpty>No se encontraron clientes</CommandEmpty>

                  <CommandList
                    className="max-h-[30vh] overflow-y-auto"
                    onWheelCapture={(e) => e.stopPropagation()}
                  >
                    <CommandGroup>
                      {filteredClients.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={`${c.name} ${c.email ?? ""} ${c.phone ?? ""}`}
                          onSelect={() => {
                            setSelectedClientId(c.id);
                            setOpenPopover(false); // ✅ solo cierra popover
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 shrink-0">
                              {c.avatarUrl ? (
                                <AvatarImage src={c.avatarUrl} alt={c.name} />
                              ) : (
                                <AvatarFallback className="bg-black text-white text-xs">
                                  {getInitials(c.name)}
                                </AvatarFallback>
                              )}
                            </Avatar>

                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {c.name}
                              </p>
                              {(c.email || c.phone) && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {c.email ?? c.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 py-5"
                onClick={() => setAssigning(false)}
                disabled={saving}
              >
                Cancelar
              </Button>

              <Button
                size="sm"
                className="flex-1 py-5"
                onClick={handleConfirm}
                disabled={!selectedClientId || saving}
              >
                {saving ? "Asignando…" : "Confirmar"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const assignVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -8,
    height: 0,
  },
  visible: {
    opacity: 1,
    y: 0,
    height: "auto",
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1], // easeOut real
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    height: 0,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1], // easeIn real
    },
  },
};
