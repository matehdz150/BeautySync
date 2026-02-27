// app/clients/[clientid]/ClientDetailView.tsx
"use client";

import { ClientDetail } from "@/lib/services/clients";

interface Props {
  data: ClientDetail;
}

export default function ClientDetailView({ data }: Props) {
  const { client, stats, bookings, reviews } = data;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* HEADER */}
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

      <div className="flex-1 overflow-y-auto p-6 space-y-10">
        {/* MÉTRICAS */}
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Métricas
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <Metric title="Total citas" value={stats.totalAppointments} />
            <Metric title="Completadas" value={stats.completedAppointments} />
            <Metric title="Canceladas" value={stats.cancelledAppointments} />
            <Metric
              title="Rating"
              value={stats.averageRating ?? "—"}
            />
            <Metric title="Reseñas" value={stats.ratingCount} />
          </div>
        </section>

        {/* HISTORIAL */}
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

        {/* REVIEWS */}
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Reseñas
          </h2>

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin reseñas
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="border rounded-lg p-4 bg-white"
                >
                  <div className="flex justify-between">
                    <p className="font-medium">
                      {r.branchName}
                    </p>
                    <p>⭐ {r.rating}</p>
                  </div>

                  {r.comment && (
                    <p className="text-sm mt-2">
                      {r.comment}
                    </p>
                  )}

                  {r.staff && r.staff.length > 0 && (
                    <div className="text-xs mt-2 text-muted-foreground">
                      Staff:
                      {r.staff.map((s) => (
                        <span key={s.id} className="ml-2">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: any }) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-muted-foreground">{title}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}