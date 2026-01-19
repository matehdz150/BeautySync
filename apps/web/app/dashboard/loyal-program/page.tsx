"use client";

import { Button } from "@/components/ui/button";
import {
  Star,
  Gift,
  Users,
  ChartLine,
  CheckCircle2,
} from "lucide-react";

export default function RewardsProgramPage() {
  return (
    <div className="h-dvh overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-12 pb-26">

        {/* ================= HERO ================= */}
        <div className="relative overflow-hidden rounded-3xl h-[420px]">
          <img
            src="https://plus.unsplash.com/premium_photo-1728670001843-8233c4371d13?q=80&w=2495&auto=format&fit=crop"
            alt="Programa de beneficios"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-black/55" />

          <div className="relative z-10 h-full flex flex-col justify-center p-10 text-white">
            <h1 className="text-4xl font-bold leading-tight">
              Programa de beneficios
            </h1>
            <p className="max-w-2xl text-lg text-white/90 mt-2">
              Aumenta la lealtad de tus clientes con puntos, recompensas y beneficios exclusivos.
            </p>

            <div className="mt-6 flex gap-4 items-center">
              <Button size="lg" className="rounded-full px-8">
                Activar programa de beneficios
              </Button>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Star className="w-5 h-5" />
                Potencia tus reservas
              </div>
            </div>
          </div>
        </div>

        {/* ================= WHAT IS IT ================= */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">¿Qué es el programa de beneficios?</h2>
          <p className="text-muted-foreground">
            Es una forma de incentivar a tus clientes a regresar y gastar más ofreciendo puntos,
            rangos, recompensas y beneficios exclusivos por su fidelidad.
          </p>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Step
            number={1}
            title="Gana puntos"
            description="Los clientes acumulan puntos por cada servicio o gasto que realicen."
            icon={<Gift className="w-6 h-6 text-indigo-600" />}
          />
          <Step
            number={2}
            title="Sube de nivel"
            description="Los clientes pueden avanzar a niveles (Bronce, Plata, Oro) con beneficios extra."
            icon={<Users className="w-6 h-6 text-indigo-600" />}
          />
          <Step
            number={3}
            title="Canjea recompensas"
            description="Usa puntos para obtener descuentos, servicios gratis o beneficios especiales."
            icon={<ChartLine className="w-6 h-6 text-indigo-600" />}
          />
        </section>

        {/* ================= BENEFITS FOR BUSINESS ================= */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Beneficios para tu negocio</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-indigo-500 mt-1" />
              Aumenta la retención de clientes recurrentes.
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-indigo-500 mt-1" />
              Diferencia tu negocio de la competencia.
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-indigo-500 mt-1" />
              Incentiva mayores ingresos por visita.
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-indigo-500 mt-1" />
              Permite campañas promocionales específicas.
            </li>
          </ul>
        </section>

        {/* ================= BENEFITS FOR CLIENT ================= */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Beneficios para tus clientes</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-indigo-500 mt-1" />
              Obtienen puntos por cada visita.
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-indigo-500 mt-1" />
              Acceden a descuentos por niveles.
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-indigo-500 mt-1" />
              Reciben beneficios exclusivos.
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-indigo-500 mt-1" />
              Pueden ver su progreso en la app.
            </li>
          </ul>
        </section>

        {/* ================= FINAL CTA ================= */}
        <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl bg-indigo-50 p-6">
          <div>
            <h3 className="font-semibold text-lg">
              Comienza a fidelizar a tus clientes
            </h3>
            <p className="text-sm text-muted-foreground">
              Activa el programa de beneficios y personalízalo cuando quieras.
            </p>
          </div>
          <Button className="rounded-full px-6">
            Activar programa de beneficios
          </Button>
        </section>
      </div>
    </div>
  );
}

/* =====================
   SUB COMPONENTS
===================== */

function Step({
  number,
  title,
  description,
  icon,
}: {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-2 p-6 border rounded-2xl bg-white">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
          {number}
        </div>
        <div className="font-semibold">{title}</div>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div>{icon}</div>
    </div>
  );
}