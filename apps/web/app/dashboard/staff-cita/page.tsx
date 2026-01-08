"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Phone,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Appointment = {
  id: string;
  date: string;
  time: string;
  durationMin: number;
  clientName: string;
  service: string;
  phone: string;
  status: "confirmed" | "pending";
};

const STAFF = {
  name: "Maria Santos",
  role: "Estilista Senior",
  initials: "MS",
  schedule: "9:00 – 18:00",
  phone: "+1 555–0101",
};

const WEEK = [
  { label: "JUE", day: 26, date: "2025-12-26" },
  { label: "VIE", day: 27, date: "2025-12-27" },
  { label: "SAB", day: 28, date: "2025-12-28" },
  { label: "DOM", day: 29, date: "2025-12-29" },
  { label: "LUN", day: 30, date: "2025-12-30" },
  { label: "MAR", day: 31, date: "2025-12-31" },
  { label: "MIE", day: 1, date: "2026-01-01" },
];

const APPTS: Appointment[] = [
  {
    id: "1",
    date: "2025-12-26",
    time: "09:00",
    durationMin: 90,
    clientName: "Emma Wilson",
    service: "Corte + Styling",
    phone: "+1 555–1001",
    status: "confirmed",
  },
  {
    id: "2",
    date: "2025-12-26",
    time: "12:30",
    durationMin: 120,
    clientName: "Michael Brown",
    service: "Color Completo",
    phone: "+1 555–1002",
    status: "pending",
  },
];

export default function Page() {
  const [selected, setSelected] = useState(0);
  const day = WEEK[selected];

  const appointments = APPTS.filter(a => a.date === day.date);
  const totalMinutes = appointments.reduce((a,b)=>a+b.durationMin,0);

  const confirmed = appointments.filter(a => a.status==="confirmed").length;
  const pending = appointments.filter(a => a.status==="pending").length;

  return (
    <main className="min-h-screen flex justify-center py-10">
      <div className="w-full max-w-5xl space-y-6">

        {/* ===== HEADER CARD WITH GRADIENT ===== */}
        <section className="rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-black to-neutral-800 px-6 py-6 flex items-center gap-4">

            <div className="flex items-center gap-4 text-white ml-2">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center font-semibold">
                {STAFF.initials}
              </div>

              <div>
                <p className="text-lg font-semibold">{STAFF.name}</p>
                <p className="text-sm opacity-90">{STAFF.role}</p>
              </div>
            </div>
          </div>

          {/* Info bar */}
          <div className="bg-white px-6 py-4 grid grid-cols-3 gap-4 text-sm text-neutral-700">
            <div className="bg-neutral-100 rounded-xl p-3 flex flex-col items-center">
              <Clock className="h-4 w-4 mb-1 opacity-70" />
              {STAFF.schedule}
            </div>

            <div className="bg-neutral-100 rounded-xl p-3 flex flex-col items-center">
              <Phone className="h-4 w-4 mb-1 opacity-70" />
              {STAFF.phone}
            </div>

            <div className="bg-neutral-100 rounded-xl p-3 flex flex-col items-center">
              <span>Esta semana</span>
              <strong>6 citas</strong>
            </div>
          </div>
        </section>

        {/* ===== WEEK STRIP ===== */}
        <section className="bg-white rounded-2xl shadow-sm border px-3 py-3 flex items-center justify-between">
          <button>{"<"}</button>

          <div className="flex gap-3">
            {WEEK.map((d,i)=>(
              <button
                key={d.date}
                onClick={()=>setSelected(i)}
                className={cn(
                  "rounded-xl px-3 py-2 flex flex-col items-center",
                  i===selected && "bg-emerald-600 text-white"
                )}
              >
                <span className="text-[11px]">{d.label}</span>
                <span className="font-semibold">{d.day}</span>
              </button>
            ))}
          </div>

          <button>{">"}</button>
        </section>

        {/* ===== SUMMARY ===== */}
        <div className="flex justify-between text-sm text-neutral-600">
          <span>
            Hoy, {day.day} de Dic — {appointments.length} citas • {totalMinutes/60}h {totalMinutes%60}min
          </span>

          <div className="flex gap-3">
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle className="h-4 w-4" /> {confirmed}
            </span>
            <span className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-4 w-4" /> {pending}
            </span>
          </div>
        </div>

        {/* ===== LISTA ===== */}
        <section className="space-y-3">
          {appointments.map(a=>(
            <div key={a.id} className="bg-white rounded-2xl shadow-sm border p-5 flex gap-5">
              
              {/* Time */}
              <div className="w-20">
                <p className="font-semibold">{a.time}</p>
                <p className="text-xs text-neutral-500">{a.durationMin} min</p>
              </div>

              {/* Info */}
              <div className="flex-1 border-l pl-5">
                <div className="flex justify-between">
                  <p className="font-medium">{a.clientName}</p>

                  {a.status==="confirmed" && (
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                      Confirmada
                    </span>
                  )}

                  {a.status==="pending" && (
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                      Pendiente
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-500 mt-1">{a.service}</p>

                <button className="text-xs text-emerald-700 mt-2 flex gap-1">
                  <Phone className="h-3.5 w-3.5" /> {a.phone}
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* ===== FOOTER ===== */}
        <section className="bg-neutral-200 rounded-xl px-6 py-2 flex justify-between">
          <span>Tiempo total ocupado</span>
          <strong>{totalMinutes} minutos</strong>
        </section>
      </div>
    </main>
  );
}