"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { useBranch } from "@/context/BranchContext";
import { api } from "@/lib/services/api";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Appointment = {
  id: string;
  title: string;
  start: string;
  end: string;
};

const DAYS = 5;

export default function CalendarPage() {
  const { branch } = useBranch();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentWeekStart, setCurrentWeekStart] = useState(
    DateTime.now().startOf("week")
  );

  // =========================
  // FETCH
  // =========================
  useEffect(() => {
    if (!branch) return;

    async function load() {
      try {
        setLoading(true);

        const start = currentWeekStart.toISODate();
        const end = currentWeekStart.plus({ days: DAYS - 1 }).toISODate();

        const data = await api<any[]>(
          `/appointments?branchId=${branch.id}&start=${start}&end=${end}`
        );

        const mapped: Appointment[] = data.map((a) => ({
          id: a.id,
          title: a.serviceName ?? "Cita",
          start: a.start,
          end: a.end,
        }));

        setAppointments(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [branch, currentWeekStart]);

  // =========================
  // DAYS
  // =========================
  const days = Array.from({ length: DAYS }).map((_, i) =>
    currentWeekStart.plus({ days: i })
  );

  // =========================
  // GROUP BY DAY
  // =========================
  const byDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {};

    for (const d of days) {
      map[d.toISODate()!] = [];
    }

    for (const a of appointments) {
      const date = DateTime.fromISO(a.start).toISODate();
      if (date && map[date]) {
        map[date].push(a);
      }
    }

    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => a.start.localeCompare(b.start));
    });

    return map;
  }, [appointments, days]);

  // =========================
  // NAVIGATION (🔥 corregido)
  // =========================
  function goPrevWeek() {
    setCurrentWeekStart((prev) => prev.minus({ days: DAYS }));
  }

  function goNextWeek() {
    setCurrentWeekStart((prev) => prev.plus({ days: DAYS }));
  }

  if (loading) {
    return <div className="p-6">Cargando calendario...</div>;
  }

  return (
    <div className="p-6 flex gap-6 h-[90vh]">
      {/* ========================= */}
      {/* 🔥 SIDEBAR */}
      {/* ========================= */}
      <div className="w-[260px] flex flex-col gap-4">
        {(() => {
          const today = DateTime.now();
          const todayKey = today.toISODate()!;
          const todayAppointments = byDay[todayKey] ?? [];

          return (
            <>
              <h1 className="text-2xl font-semibold">Hoy</h1>

              <div className="bg-[#f7f7f7] rounded-3xl p-6 text-center">
                <p className="text-5xl font-bold">{today.day}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {today.setLocale("es").toFormat("cccc")}
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 text-sm">
                Tienes {todayAppointments.length} citas hoy
              </div>

              <div className="flex flex-col gap-2">
                <StatCard
                  color="bg-gray-50"
                  value={todayAppointments.length}
                  label="Citas hoy"
                />

                <StatCard
                  color="bg-gray-50"
                  value={
                    appointments.filter(
                      (a) => DateTime.fromISO(a.start) > DateTime.now()
                    ).length
                  }
                  label="Próximas"
                />

                <StatCard
                  color="bg-gray-50"
                  value={
                    appointments.filter(
                      (a) => DateTime.fromISO(a.start) < DateTime.now()
                    ).length
                  }
                  label="Completadas"
                />
              </div>
            </>
          );
        })()}
      </div>

      {/* ========================= */}
      {/* 🔥 CALENDARIO */}
      {/* ========================= */}
      <div className="flex-1 flex flex-col gap-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-semibold">
            {(() => {
              const lastDay = days.at(-1)!;

              const text =
                days[0].month === lastDay.month
                  ? days[0].setLocale("es").toFormat("LLLL yyyy")
                  : `${days[0].setLocale("es").toFormat("LLL")} - ${lastDay
                      .setLocale("es")
                      .toFormat("LLL yyyy")}`;

              return text.charAt(0).toUpperCase() + text.slice(1);
            })()}
          </h1>

          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={goPrevWeek}
              className="rounded-full w-12 h-12"
            >
              <ChevronLeft />
            </Button>

            <Button
              variant="primary"
              onClick={goNextWeek}
              className="rounded-full w-12 h-12"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>

        {/* GRID (🔥 dinámico correcto) */}
        <div
          className="grid gap-4 flex-1"
          style={{
            gridTemplateColumns: `repeat(${DAYS}, minmax(0, 1fr))`,
          }}
        >
          {days.map((day) => {
            const dayKey = day.toISODate()!;
            const items = byDay[dayKey];

            return (
              <div
                key={dayKey}
                className="bg-[#f7f7f7] rounded-2xl p-4 flex flex-col"
              >
                <div className="text-center mb-3">
                  <p className="text-2xl font-semibold">{day.day}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {day.setLocale("es").toFormat("ccc")}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {items.map((a) => (
                    <div
                      key={a.id}
                      className="bg-white rounded-lg p-2 text-xs shadow-sm"
                    >
                      <p className="font-medium">{a.title}</p>
                      <p className="opacity-60">
                        {DateTime.fromISO(a.start).toFormat("HH:mm")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =========================
// 🔥 COMPONENTE STAT
// =========================
function StatCard({
  color,
  value,
  label,
}: {
  color: string;
  value: number;
  label: string;
}) {
  return (
    <div className={`${color} rounded-xl px-4 py-3 flex justify-between`}>
      <span className="text-xl font-bold">{value}</span>
      <span className="text-xs self-center">{label}</span>
    </div>
  );
}