"use client";

import { useEffect, useMemo, useState } from "react";
import { UserPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getClients } from "@/lib/services/clients";
import { Client } from "@/lib/services/clients";
import { useBranch } from "@/context/BranchContext";

type Props = {
  onSelect: (client: Client) => void;
};

export function ClientSelectDropdown({ onSelect }: Props) {
  const { branch } = useBranch();
  const orgId = branch?.organizationId;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !orgId) return;

    async function load() {
      setLoading(true);
      try {
        const res = await getClients(orgId);
        setClients(res ?? []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [open, orgId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
    );
  }, [clients, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-2 shadow-none"
        >
          <UserPlus className="h-4 w-4" />
          Agregar
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[320px] p-3 rounded-xl">
        {/* SEARCH */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* LIST */}
        <div className="max-h-[260px] overflow-y-auto space-y-1">
          {loading && (
            <p className="text-sm text-muted-foreground px-2 py-2">
              Cargando clientes…
            </p>
          )}

          {!loading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground px-2 py-2">
              No se encontraron clientes
            </p>
          )}

          {!loading &&
            filtered.map((client) => (
              <button
                key={client.id}
                onClick={() => {
                  onSelect(client);
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md transition",
                  "hover:bg-indigo-50"
                )}
              >
                <p className="text-sm font-medium">{client.name}</p>

                {(client.email || client.phone) && (
                  <p className="text-xs text-muted-foreground">
                    {client.email ?? client.phone}
                  </p>
                )}
              </button>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
