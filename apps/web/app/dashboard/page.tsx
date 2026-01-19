"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  User,
  Scissors,
  Sparkles,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Repeat2,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Appointment = {
  id: string;
  time: string;
  client: string;
  service: string;
  staff: string;
  durationMin: number;
  status: "confirmed" | "pending" | "done" | "canceled";
};

const TODAY = "Miércoles, 16 de enero";

const APPOINTMENTS: Appointment[] = [
  {
    id: "1",
    time: "11:30",
    client: "Mariana López",
    service: "Uñas gel + diseño",
    staff: "Sofía",
    durationMin: 60,
    status: "confirmed",
  },
  {
    id: "2",
    time: "12:45",
    client: "Carlos Rivera",
    service: "Fade premium",
    staff: "Jorge",
    durationMin: 45,
    status: "pending",
  },
  {
    id: "3",
    time: "14:10",
    client: "Ana Paulina",
    service: "Facial glow",
    staff: "Dani",
    durationMin: 50,
    status: "confirmed",
  },
];

const fade = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

export default function DashboardPage() {
  const [selectedId, setSelectedId] = useState(APPOINTMENTS[0]?.id);

  const nextAppointment = useMemo(() => {
    return APPOINTMENTS.find((x) => x.id === selectedId) ?? APPOINTMENTS[0];
  }, [selectedId]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const rest = useMemo(() => {
    return APPOINTMENTS.filter((x) => x.id !== nextAppointment?.id);
  }, [nextAppointment?.id]);

  return (
    <motion.div initial="hidden" animate="show" className="bg-white">
      
      <div className="mx-auto w-full max-w-5xl px-6 md:px-10 py-10">
        {/* TOP */}
        <motion.header variants={fade} className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs tracking-[0.22em] uppercase text-muted-foreground">
              Dashboard
            </p>

            <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
              Hoy
            </h1>

            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                {TODAY}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {APPOINTMENTS.length} citas
              </span>
            </div>
          </div>

          <div className="hidden md:flex gap-2">
            <Button variant="outline" className="rounded-full">
              Ver calendario
            </Button>
            <Button className="rounded-full">
              Nueva cita <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.header>

        {/* MAIN */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          {/* LEFT: NEXT BIG */}
          <motion.section variants={fade} className="space-y-4">
            <div className="rounded-3xl border border-black/10 bg-white p-6">
              <p className="text-xs tracking-[0.22em] uppercase text-muted-foreground">
                Lo siguiente
              </p>

              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-semibold tracking-tight">
                      {nextAppointment.time}
                    </p>
                    <StatusDot status={nextAppointment.status} />
                    <span className="text-sm text-muted-foreground">
                      {labelStatus(nextAppointment.status)}
                    </span>
                  </div>

                  <p className="mt-3 text-lg font-semibold truncate">
                    {nextAppointment.client}
                  </p>

                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <ServiceIcon service={nextAppointment.service} />
                      <span className="truncate">{nextAppointment.service}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="truncate">
                        {nextAppointment.staff} · {nextAppointment.durationMin} min
                      </span>
                    </div>
                  </div>
                </div>

                {/* BIG ACTION */}
                <div className="shrink-0">
                  <Button className="rounded-full px-5 py-6 text-base">
                    Abrir cita <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              {/* 3 BIG ACTION BUTTONS */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <BigAction
                  icon={CheckCircle2}
                  title="Confirmar"
                  desc="Todo listo"
                  variant="default"
                />
                <BigAction
                  icon={Repeat2}
                  title="Reagendar"
                  desc="Cambiar hora"
                  variant="outline"
                />
                <BigAction
                  icon={XCircle}
                  title="Cancelar"
                  desc="No viene"
                  variant="outline"
                  danger
                />
              </div>
            </div>

            {/* AFTER */}
            <div className="rounded-3xl border border-black/10 bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between">
                <p className="font-semibold">Después</p>
                <p className="text-xs text-muted-foreground">{rest.length} citas</p>
              </div>

              <div className="divide-y divide-black/10">
                {rest.map((x) => (
                  <button
                    key={x.id}
                    onClick={() => setSelectedId(x.id)}
                    className={cn(
                      "w-full text-left px-6 py-4 transition",
                      "hover:bg-black/[0.02]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {x.time} · {x.client}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground truncate">
                          {x.service}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <StatusDot status={x.status} />
                        <span className="text-xs text-muted-foreground">
                          {labelStatus(x.status)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.section>

          {/* RIGHT: IA + QUICK */}
          <motion.aside variants={fade} className="space-y-4">
            {/* IA CARD */}
            <div className="rounded-3xl border border-black/10 bg-white p-6">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Asistente</p>
                <Bot className="w-4 h-4 text-muted-foreground" />
              </div>

              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Dime qué quieres y yo lo preparo.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-2">
                <Button className="rounded-2xl justify-between h-12">
                  Resumen del día
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button variant="outline" className="rounded-2xl justify-between h-12">
                  Rellenar huecos
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button variant="outline" className="rounded-2xl justify-between h-12">
                  Mensaje a clientes
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* SIMPLE STATS */}
            <div className="rounded-3xl border border-black/10 bg-white p-6">
              <p className="font-semibold">Hoy</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Mini label="Confirmadas" value="6" />
                <Mini label="Pendientes" value="2" />
                <Mini label="Canceladas" value="1" />
                <Mini label="Ingresos" value="$1,420" />
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </motion.div>
  );
}

/* =====================
   UI PIECES
===================== */

function BigAction({
  icon: Icon,
  title,
  desc,
  variant,
  danger,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  variant: "default" | "outline";
  danger?: boolean;
}) {
  return (
    <Button
      variant={variant}
      className={cn(
        "h-16 rounded-2xl justify-start gap-3 px-4",
        danger ? "border-red-200 text-red-600 hover:text-red-600" : ""
      )}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-xl border border-black/10 bg-white flex items-center justify-center",
          danger ? "border-red-200" : ""
        )}
      >
        <Icon className={cn("w-5 h-5", danger ? "text-red-600" : "text-black/70")} />
      </div>

      <div className="text-left">
        <p className="text-sm font-semibold leading-none">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
      </div>
    </Button>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function StatusDot({ status }: { status: Appointment["status"] }) {
  const cls =
    status === "confirmed"
      ? "bg-green-500"
      : status === "pending"
        ? "bg-amber-500"
        : status === "done"
          ? "bg-slate-400"
          : "bg-red-500";

  return <span className={cn("inline-block h-2.5 w-2.5 rounded-full", cls)} />;
}

function labelStatus(status: Appointment["status"]) {
  if (status === "confirmed") return "Confirmada";
  if (status === "pending") return "Pendiente";
  if (status === "done") return "Hecha";
  return "Cancelada";
}

function ServiceIcon({ service }: { service: string }) {
  const s = service.toLowerCase();

  if (s.includes("uñas")) return <Sparkles className="w-4 h-4" />;
  if (s.includes("fade") || s.includes("corte") || s.includes("barba"))
    return <Scissors className="w-4 h-4" />;

  return <Sparkles className="w-4 h-4" />;
}