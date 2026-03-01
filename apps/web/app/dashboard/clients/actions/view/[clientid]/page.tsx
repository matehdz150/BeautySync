// app/clients/[clientid]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getClientDetail, ClientDetail } from "@/lib/services/clients";
import ClientDetailView from "./ClientDetailView";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Star } from "lucide-react";



export default function Page() {
  const params = useParams();
  const clientId = params?.clientid as string;

  const [data, setData] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;

    async function load() {
      try {
        const res = await getClientDetail(clientId);
        console.log(res)
        setData(res);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el cliente");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [clientId]);

  if (loading) return <div className="p-6">Cargando cliente...</div>;

  if (error || !data) {
    return (
      <div className="p-6 text-red-500">{error ?? "Cliente no encontrado"}</div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="flex h-[calc(100vh-80px)]">
        {/* LEFT SIDEBAR */}
        <ClientSidebar data={data} />

        {/* RIGHT CONTENT */}
        <div className="flex-1 min-w-0">
          <ClientDetailView data={data} />
        </div>
      </div>
    </div>
  );
}

function ClientSidebar({ data }: { data: ClientDetail }) {
  const { client, stats } = data;

  const createdLabel = client.createdAt
    ? new Date(client.createdAt).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const initial = (client.name?.trim()?.[0] ?? "C").toUpperCase();

  return (
    <aside className="w-[320px] shrink-0 border-r bg-white flex flex-col">
      {/* TOP */}
      <div className="px-6 pt-10 pb-6 flex flex-col items-center">
        <Avatar className="h-20 w-20">
          <AvatarImage
            src={client.avatarUrl ?? undefined}
            alt={client.name ?? "Cliente"}
          />
          <AvatarFallback className="text-lg font-semibold">
            {initial}
          </AvatarFallback>
        </Avatar>

        <h2 className="mt-4 text-lg font-semibold text-center">
          {client.name ?? "Cliente"}
        </h2>

        <p className="text-sm text-muted-foreground mt-1 text-center truncate max-w-[240px]">
          {client.email ?? "—"}
        </p>

        <p className="text-sm text-muted-foreground text-center">
          {client.phone ?? "—"}
        </p>

        <div className="mt-5 flex items-center gap-3 w-full justify-center">
          <Button
            variant="outline"
            className="rounded-full px-4 shadow-none"
          >
            Actions
          </Button>

          <Button className="rounded-full px-6">
            Book now
          </Button>
        </div>
      </div>

      <Separator />

      {/* STATS */}
      <div className="px-6 py-6 space-y-6 text-sm">
        <StatRow label="Total citas" value={stats.totalAppointments} />

        <StatRow
          label="Completadas"
          value={stats.completedAppointments}
        />

        <StatRow
          label="Canceladas"
          value={stats.cancelledAppointments}
        />

        <RatingRow value={stats.averageRating} />

        <StatRow
          label="Reseñas"
          value={stats.ratingCount}
        />

        <Separator />

        <div className="text-xs text-muted-foreground">
          Created {createdLabel}
        </div>
      </div>
    </aside>
  );
}

function StatRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">
        {label}
      </span>
      <span className="font-semibold text-base">
        {value}
      </span>
    </div>
  );
}


function RatingRow({
  value,
}: {
  value: number | null;
}) {
  if (!value || value <= 0) {
    return (
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">
          Rating
        </span>
        <span className="text-base font-semibold">
          —
        </span>
      </div>
    );
  }

  const rounded = Math.round(value);

  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">
        Rating
      </span>

      <div className="flex items-center gap-1">
        {Array.from({ length: rounded }).map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4 fill-black text-black"
          />
        ))}

        <span className="ml-2 text-sm font-semibold">
          {value.toFixed(1)}
        </span>
      </div>
    </div>
  );
}