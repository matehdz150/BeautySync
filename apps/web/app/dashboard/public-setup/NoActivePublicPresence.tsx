"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBranch } from "@/context/BranchContext";
import { enablePublicPresence } from "@/lib/services/publicPresence";
import {
  CheckCircle2,
  Link as LinkIcon,
  CalendarCheck,
  Users,
  Smartphone,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function PublicPresencePage() {
  const { branch } = useBranch();
  const router = useRouter();

  const [activating, setActivating] = useState(false);

  async function handleActivate() {
    if (!branch) return;

    try {
      setActivating(true);
      await enablePublicPresence(branch.id);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("No se pudo activar la presencia pública");
    } finally {
      setActivating(false);
    }
  }

  return (
    <div className="min-h-dvh overflow-y-auto bg-white">
      {/* TOP WASH (like the reference image) */}

      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 py-10 pb-28">
        {/* HEADER */}
        <header className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 backdrop-blur px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Uso gratuito
          </div>

          <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
            Presencia pública para recibir
            <br />
            citas sin fricción
          </h1>

          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            Haz visible tu negocio y deja que tus clientes reserven desde un{" "}
            <span className="text-black font-medium">enlace público</span> o
            desde la app. Menos mensajes, más citas confirmadas.
          </p>
        </header>

        {/* MAIN GRID */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          {/* LEFT: COPY + CTA */}
          <section className="space-y-6">
            <ul className="space-y-3 text-sm md:text-base">
              <Bullet>
                Aumenta tus ingresos recibiendo citas{" "}
                <span className="font-medium text-black">24/7</span>
              </Bullet>
              <Bullet>
                Comparte tu link en WhatsApp, Instagram o Google Maps
              </Bullet>
              <Bullet>
                Tus clientes pueden reservar y controlar sus citas sin hablarte
              </Bullet>
            </ul>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                className="rounded-full px-7 bg-black text-white hover:bg-black/90"
                onClick={handleActivate}
                disabled={activating}
              >
                {activating ? "Activando…" : "Empezar ahora"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button
                size="lg"
                variant="ghost"
                className="rounded-full px-6"
              >
                Más información
              </Button>
            </div>

            {/* MINI BENEFITS STRIP */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6">
              <MiniStat icon={<CalendarCheck className="w-4 h-4" />} title="Reservas 24/7" />
              <MiniStat icon={<Smartphone className="w-4 h-4" />} title="App + Web" />
              <MiniStat icon={<Users className="w-4 h-4" />} title="Menos fricción" />
            </div>
          </section>

          {/* RIGHT: MOCKUP COLLAGE */}
          <aside className="relative">
            <div className="relative mx-auto w-full max-w-[520px]">
              {/* main phone/card */}
              <div className="rounded-[2rem] border border-black/10 bg-white/70 backdrop-blur p-4 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.35)]">
                <div className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white">
                  <img
                    src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Studio preview"
                    className="h-[260px] w-full object-cover"
                  />

                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Trendy Studio</p>
                      <span className="text-xs text-muted-foreground">
                        5.0 ★ · 700 reviews
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Centro · 2 km · Disponible hoy
                    </p>

                    <div className="mt-4 space-y-2 text-sm">
                      <Row label="Corte premium" value="45 min" />
                      <Row label="Uñas gel" value="60 min" />
                      <Row label="Facial glow" value="50 min" />
                    </div>
                  </div>
                </div>
              </div>

              {/* floating membership-like card */}
              <div className="absolute -bottom-8 -right-8 w-[280px] rounded-3xl border border-black/10 bg-white shadow-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Link público</p>
                  <div className="h-9 w-9 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                    <LinkIcon className="w-4 h-4 text-indigo-600" />
                  </div>
                </div>

                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Comparte tu página y recibe citas sin mensajes.
                </p>

                <div className="mt-4 space-y-2">
                  <MiniItem title="Reservas instantáneas" />
                  <MiniItem title="Horarios claros" />
                  <MiniItem title="Confirmación automática" />
                </div>
              </div>

              {/* soft shadow blob behind */}
              <div className="pointer-events-none absolute -z-10 left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
            </div>
          </aside>
        </div>

        {/* SECOND SECTION (simple, clean) */}
        <section className="mt-16 rounded-3xl border border-black/10 bg-white/70 backdrop-blur p-8">
          <h3 className="text-xl font-semibold">
            Al activar tu presencia pública podrás:
          </h3>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Feature text="Mostrar tu negocio al público" />
            <Feature text="Recibir citas desde la app" />
            <Feature text="Compartir un enlace público" />
            <Feature text="Elegir qué servicios son visibles" />
            <Feature text="Definir qué staff puede reservarse" />
            <Feature text="Configurar reglas de anticipación" />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Actívalo en segundos</p>
              <p className="text-sm text-muted-foreground">
                Puedes desactivarlo cuando quieras.
              </p>
            </div>

            <Button
              className="rounded-full px-7 bg-black text-white hover:bg-black/90"
              onClick={handleActivate}
              disabled={activating}
            >
              {activating ? "Activando…" : "Activar ahora"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* =====================
   SUB COMPONENTS
===================== */

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-muted-foreground">
      <CheckCircle2 className="w-5 h-5 text-black mt-0.5" />
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}

function MiniStat({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm font-medium">{title}</p>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <CheckCircle2 className="w-4 h-4 text-indigo-500" />
      <span>{text}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-3 py-2">
      <span className="text-sm">{label}</span>
      <span className="text-xs text-muted-foreground">{value}</span>
    </div>
  );
}

function MiniItem({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2">
      <span className="h-2 w-2 rounded-full bg-indigo-500/70" />
      <span className="text-xs">{title}</span>
    </div>
  );
}