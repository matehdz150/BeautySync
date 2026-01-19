"use client";

import { Button } from "@/components/ui/button";
import { useBranch } from "@/context/BranchContext";
import { disablePublicPresence } from "@/lib/services/publicPresence";
import {
  Link as LinkIcon,
  CheckCircle2,
  Globe,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ActivePublicPresence({ slug }: { slug: string }) {
  const publicUrl = `https://localhost:3000/book/${slug}`;

  const { branch } = useBranch();
  const router = useRouter();

  function copy() {
    navigator.clipboard.writeText(publicUrl);
  }

  async function handleDisable() {
    if (!branch) return;

    if (!confirm("¿Seguro que deseas desactivar la presencia pública?")) return;

    try {
      await disablePublicPresence(branch.id);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("No se pudo desactivar la presencia pública");
    }
  }

  return (
    <div className="min-h-dvh overflow-y-auto bg-white pb-28">

      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 py-10 space-y-10">
        {/* ================= HEADER ================= */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 backdrop-blur px-3 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Presencia pública activa
            </div>

            <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
              Tu negocio ya está visible
            </h1>

            <p className="mt-3 text-base md:text-lg text-muted-foreground leading-relaxed">
              Tus clientes pueden reservar citas desde tu enlace público.
              Comparte tu link y deja que el sistema confirme por ti.
            </p>

            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="w-4 h-4" />
              Disponible 24/7 · App + Web
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => window.open(publicUrl)}
            >
              Ver mi página <ExternalLink className="w-4 h-4 ml-2" />
            </Button>

            <Button className="rounded-full bg-black text-white hover:bg-black/90">
              Abrir citas <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </header>

        {/* ================= MAIN GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-start">
          {/* LEFT */}
          <section className="space-y-6">
            {/* LINK CARD */}
            <div className="rounded-3xl border border-black/10 bg-white/70 backdrop-blur p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Tu enlace público</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Copia y comparte este link en redes, WhatsApp o Google.
                  </p>
                </div>

                <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                  <LinkIcon className="w-4 h-4 text-indigo-600" />
                </div>
              </div>

              <div className="mt-5 flex flex-col md:flex-row gap-3">
                <div className="flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-mono text-black/80 overflow-hidden">
                  <span className="block truncate">{publicUrl}</span>
                </div>

                <Button
                  onClick={copy}
                  variant="outline"
                  className="rounded-full"
                >
                  Copiar enlace
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MiniInfo title="Reservas 24/7" desc="Siempre abierto" />
                <MiniInfo title="Confirmación" desc="Menos mensajes" />
                <MiniInfo title="Más citas" desc="Más conversión" />
              </div>
            </div>

            {/* SIMPLE BENEFITS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Info title="100% gratuito" description="No tiene costo adicional." />
              <Info
                title="Control total"
                description="Tú decides qué servicios y staff están visibles."
              />
              <Info
                title="Siempre editable"
                description="Puedes desactivarlo o modificarlo cuando quieras."
              />
            </div>

            {/* DANGER ZONE (clean) */}
            <div className="rounded-3xl border border-red-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>

                <div>
                  <p className="font-semibold">Zona sensible</p>
                  <p className="text-sm text-muted-foreground">
                    Si lo desactivas, tu enlace dejará de funcionar.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground max-w-xl">
                  Úsalo si de verdad necesitas pausar reservas. Tus clientes ya
                  no podrán agendar.
                </p>

                <Button
                  variant="outline"
                  onClick={handleDisable}
                  className="rounded-full border-red-200 text-red-700 hover:text-red-700"
                >
                  Desactivar presencia pública
                </Button>
              </div>
            </div>
          </section>

          {/* RIGHT: PREVIEW MOCKUP */}
          <aside className="relative">
            <div className="relative mx-auto w-full max-w-[560px]">
              {/* big preview card */}
              <div className="rounded-[2rem] border border-black/10 bg-white/70 backdrop-blur p-4 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.35)]">
                <div className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white">
                  <img
                    src="https://images.unsplash.com/photo-1695527081874-b674c46f40fb?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Vista previa de presencia pública"
                    className="h-[300px] w-full object-cover"
                  />

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">
                          {branch?.name ?? "Tu negocio"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Reservas rápidas · Confirmación en minutos
                        </p>
                      </div>

                      <div className="shrink-0 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium">
                        Activo
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <PreviewStat label="Visitas hoy" value="128" />
                      <PreviewStat label="Citas" value="9" />
                      <PreviewStat label="Conversión" value="7.0%" />
                      <PreviewStat label="Rating" value="4.9 ★" />
                    </div>

                    <div className="mt-5 flex gap-2">
                      <Button className="rounded-full bg-black text-white hover:bg-black/90">
                        Ver booking <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>

                      <Button variant="outline" className="rounded-full">
                        Editar perfil
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* soft blob behind */}
              <div className="pointer-events-none absolute -z-10 left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* =====================
   SUB COMPONENTS
===================== */

function Info({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 space-y-2">
      <h4 className="font-semibold">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function MiniInfo({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}