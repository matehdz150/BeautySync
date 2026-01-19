"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus, UserX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ClientListItem } from "./ClientListItem";
import { getClients } from "@/lib/services/clients";
import { useAppointmentBuilder } from "@/context/AppointmentBuilderContext";

type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
};

export function ClientSelector({
  clientId,
  onClose,
  orgId,
}: {
  clientId?: string;
  onClose: () => void;
  orgId: string;
}) {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  const { setClient } = useAppointmentBuilder();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getClients(orgId);
        setClients(res ?? []);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [orgId]);

  const filtered = clients.filter((c) =>
    (c.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="w-full border-r p-6 flex flex-col gap-4 h-full">
      <h2 className="font-semibold text-lg">Seleccionar cliente</h2>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente"
          className="pl-9 shadow-none py-5"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ADD NEW */}
      <button
        className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition w-full"
        onClick={() => alert("TODO: crear cliente")}
      >
        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
          <UserPlus className="h-5 w-5 text-indigo-500" />
        </div>
        <span className="font-medium">Añadir un nuevo cliente</span>
      </button>

      {/* WALK-IN */}
      <button
        className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition w-full"
        onClick={() => {
          setClient(undefined); // sin cliente
          onClose();
        }}
      >
        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
          <UserX className="h-5 w-5 text-indigo-500" />
        </div>
        <span className="font-medium">Sin cliente (Walk-in)</span>
      </button>

      <Separator />

      {/* SCROLLABLE LIST */}
      <div className="space-y-1 pr-1 max-h-[65vh] min-h-[65vh] overflow-y-auto pb-10">
        {loading && (
          <p className="text-sm text-muted-foreground px-2">
            Cargando clientes…
          </p>
        )}

        {!loading &&
          filtered.map((c) => (
            <ClientListItem
              key={c.id}
              name={c.name}
              email={c.email}
              selected={clientId === c.id}
              onClick={() => {
                setClient(c);
                onClose();
              }}
            />
          ))}

        {!loading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground px-2">
            No se encontraron clientes
          </p>
        )}
      </div>
    </aside>
  );
}
