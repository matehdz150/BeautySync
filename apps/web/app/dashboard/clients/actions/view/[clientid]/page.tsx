"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getClientDetail,
  ClientDetail,
} from "@/lib/services/clients";

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params?.clientid as string;

  const [data, setData] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;

    async function load() {
      try {
        setLoading(true);
        const res = await getClientDetail(clientId);
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

  if (loading) {
    return <div className="p-6">Cargando cliente...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-6 text-red-500">
        {error ?? "Cliente no encontrado"}
      </div>
    );
  }

  const { client, stats, bookings } = data;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* ================= HEADER ================= */}
      <div className="p-6 border-b shrink-0 bg-white">
        <h1 className="text-2xl font-bold">
          {client.name ?? "Cliente"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {client.email ?? "Sin email"}
        </p>
        <p className="text-sm text-muted-foreground">
          {client.phone ?? "Sin teléfono"}
        </p>
      </div>

      {/* ================= CONTENT SCROLLABLE ================= */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* ================= STATS ================= */}
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Métricas
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="border rounded-lg p-4">
              <p className="text-muted-foreground">
                Total citas
              </p>
              <p className="text-xl font-semibold">
                {stats.totalAppointments}
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-muted-foreground">
                Completadas
              </p>
              <p className="text-xl font-semibold">
                {stats.completedAppointments}
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-muted-foreground">
                Canceladas
              </p>
              <p className="text-xl font-semibold">
                {stats.cancelledAppointments}
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-muted-foreground">
                Rating
              </p>
              <p className="text-xl font-semibold">
                {stats.averageRating ?? "—"}
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-muted-foreground">
                Reseñas
              </p>
              <p className="text-xl font-semibold">
                {stats.ratingCount}
              </p>
            </div>
          </div>
        </section>

        {/* ================= HISTORY ================= */}
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Historial
          </h2>

          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin historial
            </p>
          ) : (
            <div className="space-y-6">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="border rounded-lg p-4 space-y-4 bg-white"
                >
                  {/* Booking */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">
                        {b.branchName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(b.startsAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-sm">
                      ${(b.totalCents / 100).toLocaleString()}
                    </div>
                  </div>

                  {/* Appointments */}
                  <div className="space-y-2">
                    {b.appointments.map((a) => (
                      <div
                        key={a.id}
                        className="border rounded p-3 text-sm bg-muted/30"
                      >
                        <p className="font-medium">
                          {a.service.name}
                        </p>

                        <p>
                          Staff: {a.staff?.name ?? "—"}
                        </p>

                        <p>
                          {new Date(a.start).toLocaleString()}
                        </p>

                        {a.priceCents != null && (
                          <p>
                            ${(a.priceCents / 100).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}