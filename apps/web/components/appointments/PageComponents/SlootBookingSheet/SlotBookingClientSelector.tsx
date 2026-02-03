"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, User, UserX, Check } from "lucide-react";

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
     Load clients
  ============================ */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await getClients(orgId);
        if (!cancelled) setClients(res ?? []);
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
     Search
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
    <div className="flex flex-col gap-4">
      {/* ================= SEARCH ================= */}
      <div className="sticky top-0 bg-white z-10 pt-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Buscar por nombre, email o teléfono"
            className="pl-9 py-5"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ================= WALK-IN ================= */}
      <Button
        variant={!clientId ? "secondary" : "outline"}
        className="w-full justify-start gap-3 rounded-xl py-4"
        onClick={() => {
          onSelect(undefined);
          onClose();
        }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <UserX className="h-4 w-4" />
        </div>

        <div className="text-left">
          <p className="font-semibold text-sm">Sin cliente</p>
          <p className="text-xs text-muted-foreground">
            Cita sin registro (Walk-in)
          </p>
        </div>
      </Button>

      <Separator />

      {/* ================= LIST ================= */}
      <div className="space-y-1 max-h-[52vh] overflow-y-auto pr-1">
        {loading && (
          <p className="text-xs text-muted-foreground px-2 py-2">
            Cargando clientes…
          </p>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No se encontraron clientes
          </div>
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
                group w-full flex items-center justify-between gap-4
                rounded-xl px-4 py-3 text-left transition
                ${
                  selected
                    ? "bg-indigo-50 border border-indigo-200"
                    : "hover:bg-muted"
                }
              `}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`
    flex h-9 w-9 items-center justify-center rounded-full border overflow-hidden
    ${
      selected
        ? "bg-indigo-500 text-white border-indigo-500"
        : "bg-muted text-muted-foreground"
    }
  `}
                >
                  {c.avatarUrl ? (
                    <img
                      src={c.avatarUrl}
                      alt={c.name}
                      className="h-full w-full object-cover"
                    />
                  ) : selected ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{c.name}</p>
                  {(c.phone || c.email) && (
                    <p className="text-xs text-muted-foreground truncate">
                      {c.phone ?? c.email}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
