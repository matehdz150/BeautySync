"use client";

import { useState } from "react";
import { ClientDetail } from "@/lib/services/clients";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown, Star } from "lucide-react";

interface Props {
  data: ClientDetail;
}

type Tab = "overview" | "bookings" | "sales" | "rewards" | "reviews";

export default function ClientDetailView({ data }: Props) {
  const { client, stats, bookings, reviews } = data;

  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-white">
      {/* TABS */}
      <div className="px-6 pt-6">
        <div className="flex gap-2 border-b pb-4">
          <TabButton
            label="Citas"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <TabButton
            label="Reseñas"
            active={activeTab === "reviews"}
            onClick={() => setActiveTab("reviews")}
          />
          <TabButton
            label="Ventas"
            active={activeTab === "sales"}
            onClick={() => setActiveTab("sales")}
          />
          <TabButton
            label="Mensajes"
            active={activeTab === "rewards"}
            onClick={() => setActiveTab("rewards")}
          />
          <TabButton
            label="Beneficios y recompensas"
            active={activeTab === "rewards"}
            onClick={() => setActiveTab("rewards")}
          />
          <TabButton
            label="Estadisticas"
            active={activeTab === "rewards"}
            onClick={() => setActiveTab("rewards")}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-10">
        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <>
            <BookingsSection bookings={bookings} />
          </>
        )}

        {activeTab === "reviews" && (
          <>
            <ReviewsSection reviews={reviews} />
          </>
        )}

        {/* CITAS */}
        {activeTab === "bookings" && <BookingsSection bookings={bookings} />}

        {/* VENTAS */}
        {activeTab === "sales" && <SalesSection bookings={bookings} />}

        {/* REWARDS */}
        {activeTab === "rewards" && <RewardsSection client={client} />}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   TABS                                     */
/* -------------------------------------------------------------------------- */

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full text-sm font-medium transition
        ${
          active
            ? "bg-black text-white"
            : "text-muted-foreground hover:bg-muted"
        }
      `}
    >
      {label}
    </button>
  );
}

type StatusFilter = "ALL" | "COMPLETED" | "CONFIRMED" | "CANCELLED" | "PAYED";

function BookingsSection({ bookings }: any) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [openDropdown, setOpenDropdown] = useState(false);

  // 🔹 Ordenar más reciente → más antiguo
  const sortedBookings = useMemo(() => {
    return [...bookings].sort(
      (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
    );
  }, [bookings]);

  // 🔹 Filtrar
  const filteredBookings = useMemo(() => {
    if (statusFilter === "ALL") return sortedBookings;
    return sortedBookings.filter((b) => b.status === statusFilter);
  }, [sortedBookings, statusFilter]);

  const bookingsByMonth = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    filteredBookings.forEach((b: any) => {
      const date = new Date(b.startsAt);

      const monthKey = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }

      grouped[monthKey].push(b);
    });

    return grouped;
  }, [filteredBookings]);

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Historial de citas</h2>

      {/* FILTERS */}
      <div className="flex gap-2 mb-6 flex-wrap items-center justify-between bg-gray-50 py-4 px-3">
        <div className="flex gap-2">
          <FilterButton
            label="Todas"
            active={statusFilter === "ALL"}
            onClick={() => setStatusFilter("ALL")}
          />

          <FilterButton
            label="Completadas"
            active={statusFilter === "COMPLETED"}
            onClick={() => setStatusFilter("COMPLETED")}
          />
        </div>

        {/* DROPDOWN */}
        <div className="relative ">
          <Button
            variant={"primary"}
            onClick={() => setOpenDropdown((prev) => !prev)}
            className="px-5 py-5 rounded-full text-sm font-medium transition shadow-none"
          >
            Mas <ChevronDown />
          </Button>

          {openDropdown && (
            <div className="absolute mt-2 w-44 bg-white border rounded-lg shadow-lg z-20">
              {["CONFIRMED", "CANCELLED", "PAYED"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status as StatusFilter);
                    setOpenDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
                >
                  {formatStatusLabel(status)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* EMPTY STATE */}
      {filteredBookings.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay citas para este filtro
        </p>
      )}

      {/* BOOKINGS TIMELINE */}
      <div className="relative pl-16">
        {/* Línea vertical */}
        <div className="absolute left-7 top-0 bottom-0 w-[2px] bg-gray-300" />

        {Object.entries(bookingsByMonth).map(([month, bookings]) => (
          <div key={month} className="mb-12">
            {/* Month label */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground capitalize">
                {month}
              </h3>
            </div>

            <div className="space-y-10">
              {bookings.map((b: any) => (
                <div key={b.id} className="relative">
                  {/* Círculo */}
                  <div className="absolute left-[-3.5rem] top-6 w-10 h-10 bg-black rounded-full flex items-center justify-center shadow-sm">
                    <Calendar size={16} className="text-white" />
                  </div>

                  {/* Card */}
                  <div className="border rounded-xl p-6 bg-white  space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground">Cita</p>

                        <p className="text-xs text-muted-foreground">
                          {new Date(b.startsAt).toLocaleString()} ·{" "}
                          <span className="text-green-600 font-medium">
                            {b.status}
                          </span>
                        </p>
                      </div>

                      <p className="font-semibold text-base">
                        ${(b.totalCents / 100).toLocaleString()}
                      </p>
                    </div>

                    {b.appointments.map((a: any) => (
                      <div key={a.id} className="space-y-1">
                        <p className="font-semibold">{a.service.name}</p>

                        <p className="text-sm text-muted-foreground">
                          {new Date(a.start).toLocaleTimeString()} ·{" "}
                          {a.staff?.name ?? "—"}
                        </p>
                      </div>
                    ))}

                    <div className="flex gap-3 pt-2">
                      <Button
                        variant={"default"}
                        className="px-4 py-1.5 text-sm rounded-full"
                      >
                        Ver detalles
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                               HELPERS                                      */
/* -------------------------------------------------------------------------- */

function formatStatusLabel(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "Confirmadas";
    case "CANCELLED":
      return "Canceladas";
    case "PAYED":
      return "Pagadas";
    default:
      return status;
  }
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-5 py-3 rounded-full text-sm font-medium transition
        ${
          active
            ? "bg-white text-black border"
            : "bg-muted text-muted-foreground hover:bg-muted/70"
        }
      `}
    >
      {label}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 REVIEWS                                    */
/* -------------------------------------------------------------------------- */

function ReviewsSection({ reviews }: any) {
  if (!reviews || reviews.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-4">Reseñas</h2>
        <p className="text-sm text-muted-foreground">
          Este cliente aún no tiene reseñas.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Reseñas</h2>

      <div className="space-y-4">
        {reviews.map((r: any) => {
          const date = new Date(r.createdAt).toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });

          return (
            <div
              key={r.id}
              className="border rounded-xl p-4 bg-white hover:bg-muted/20 transition"
            >
              {/* HEADER */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{r.branchName}</p>

                  <p className="text-xs text-muted-foreground">{date}</p>
                </div>

                <div className="flex items-center gap-1">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
              </div>

              {/* COMMENT */}
              <div className="text-sm text-muted-foreground leading-relaxed mt-2">
                {r.comment ? (
                  r.comment
                ) : (
                  <span className="italic text-muted-foreground/70">
                    No se agregó comentario.
                  </span>
                )}
              </div>

              {/* STAFF */}
              {r.staff && r.staff.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.staff.map((s: any) => (
                    <span
                      key={s.id}
                      className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  SALES                                     */
/* -------------------------------------------------------------------------- */

function SalesSection({ bookings }: any) {
  const total = bookings.reduce((acc: number, b: any) => acc + b.totalCents, 0);

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Ventas</h2>

      <div className="text-3xl font-bold">
        ${(total / 100).toLocaleString()}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                REWARDS                                     */
/* -------------------------------------------------------------------------- */

function RewardsSection({ client }: any) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Beneficios y recompensas</h2>

      <div className="border rounded-lg p-4 bg-white space-y-2">
        <p>
          Cliente: <span className="font-medium">{client.name}</span>
        </p>

        <p className="text-muted-foreground text-sm">
          Aquí puedes agregar sistema de puntos, nivel VIP, recompensas
          acumuladas, etc.
        </p>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    CONFIRMED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    PAYED: "bg-purple-100 text-purple-700",
  };

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium ${
        styles[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}
