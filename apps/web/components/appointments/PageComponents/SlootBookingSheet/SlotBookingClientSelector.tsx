"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, User, UserX } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getClients } from "@/lib/services/clients";

/* =========================
   Types
========================= */

export type ClientLite = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
};

/* =========================
   Props
========================= */

type Props = {
  orgId: string;
  clientId?: string;
  onSelect: (client: ClientLite | undefined) => void;
  onClose: () => void;
};

/* =========================
   Component
========================= */

export function SlotBookingClientSelector({
  orgId,
  clientId,
  onSelect,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [loading, setLoading] = useState(false);

  /* ============================
     Load clients (MISMO ORIGEN)
  ============================ */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await getClients(orgId);
        if (!cancelled) {
          setClients(res ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  /* ============================
     Client-side search
  ============================ */

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;

    return clients.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  /* ============================
     Render
  ============================ */

  return (
    <div className="space-y-4 px-6 py-4">
      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Buscar cliente por nombre, email o teléfono"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* WALK-IN */}
      <Button
        variant={!clientId ? "secondary" : "outline"}
        className="w-full justify-start"
        onClick={() => {
          onSelect(undefined);
          onClose();
        }}
      >
        <UserX className="h-4 w-4 mr-2" />
        Sin cliente (Walk-in)
      </Button>

      <Separator />

      {/* LIST */}
      <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
        {loading && (
          <p className="text-xs text-muted-foreground px-2">
            Cargando clientes…
          </p>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-xs text-muted-foreground px-2">
            No se encontraron clientes
          </p>
        )}

        {filtered.map((c) => {
          const selected = c.id === clientId;

          return (
            <button
              key={c.id}
              onClick={() => {
                onSelect(c);
                onClose();
              }}
              className={`
                w-full flex items-center justify-between
                rounded-md px-3 py-2 text-sm
                hover:bg-muted transition
                ${selected ? "bg-muted" : ""}
              `}
            >
              <div className="text-left">
                <div className="font-medium">{c.name}</div>
                {(c.phone || c.email) && (
                  <div className="text-xs text-muted-foreground">
                    {c.phone ?? c.email}
                  </div>
                )}
              </div>

              {selected && (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}