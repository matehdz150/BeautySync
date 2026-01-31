"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { DateTime } from "luxon";
import { getClients } from "@/lib/services/clients";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

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

  return (
    <div className="px-5 py-6 bg-white border-b">
      {/* HEADER ROW */}
      <div className="flex items-center justify-between gap-4">
        {/* LEFT: Avatar + info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {hasClient && booking.client.imageUrl ? (
              <AvatarImage
                src={booking.client.imageUrl}
                alt={booking.client.name}
              />
            ) : (
              <AvatarFallback className="bg-black text-white text-sm font-medium">
                {getInitials(booking.client?.name)}
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
          Assign client UI
      ============================ */}
      {assigning && (
        <div className="mt-4 rounded-md border bg-muted/30 p-3 space-y-2">
          <select
            className="w-full rounded-md border bg-white p-2 text-sm"
            value={selectedClientId ?? ""}
            onChange={(e) => setSelectedClientId(e.target.value)}
          >
            <option value="">Selecciona un cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setAssigning(false)}
              disabled={saving}
            >
              Cancelar
            </Button>

            <Button
              size="sm"
              className="flex-1"
              onClick={handleConfirm}
              disabled={!selectedClientId || saving}
            >
              {saving ? "Asignando…" : "Confirmar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}