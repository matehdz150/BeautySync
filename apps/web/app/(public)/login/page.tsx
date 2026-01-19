"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  User,
  BriefcaseBusiness,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function LoginSelectorPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-white">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-120 h-175 w-255 -translate-x-1/2 z-0 rounded-full blur-3xl
             bg-gradient-to-b from-indigo-400/75 via-indigo-400/10 to-transparent"
        initial={{ opacity: 0, scale: 0.92, filter: "blur(90px)" }}
        animate={{
          opacity: 1,
          scale: [1, 1.03, 1],
          y: [0, 10, 0],
          filter: ["blur(50px)", "blur(58px)", "blur(50px)"],
        }}
        transition={{
          opacity: { duration: 1.4, ease: "easeOut" },
          scale: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
          y: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
          filter: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/12 -top-60 h-125 w-55 -translate-x-1/2 z-0 rounded-full blur-3xl
             bg-gradient-to-b from-indigo-400/75 via-indigo-400/10 to-transparent"
        initial={{ opacity: 0, scale: 0.92, filter: "blur(90px)" }}
        animate={{
          opacity: 1,
          scale: [1, 1.03, 1],
          y: [0, 10, 0],
          filter: ["blur(50px)", "blur(58px)", "blur(50px)"],
        }}
        transition={{
          opacity: { duration: 1.4, ease: "easeOut" },
          scale: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
          y: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
          filter: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
        }}
      />
      {/* LEFT */}
      <div className="relative flex flex-col">
        {/* top bar */}
        <div className="h-14 px-5 flex items-center">
          <button
            onClick={() => router.back()}
            className={cn(
              "h-10 w-10 rounded-full",
              "flex items-center justify-center",
              "hover:bg-black/[0.04] active:bg-black/[0.06]"
            )}
          >
            <ArrowLeft className="h-5 w-5 text-black" />
          </button>
        </div>

        {/* content */}
        <div className="flex-1 px-6 pb-10 flex flex-col items-center justify-start">
          <div className="w-full max-w-md pt-6">
            <h1 className="text-center text-xl font-semibold tracking-tight">
              Regístrate/inicia sesión
            </h1>

            <div className="mt-8 space-y-4">
              {/* Users */}
              <LoginCard
                icon={<User className="h-5 w-5 text-indigo-600" />}
                title="BeautySync para clientes"
                subtitle="Reserva en centros de belleza y spas cerca de ti"
                onClick={() => router.push("/login/users")}
              />

              {/* Manager */}
              <LoginCard
                icon={<BriefcaseBusiness className="h-5 w-5 text-indigo-600" />}
                title="BeautySync para profesionales"
                subtitle="Gestiona tu negocio y hazlo crecer"
                onClick={() => router.push("/login/manager")}
              />
            </div>

            {/* footer links (opcional) */}
            <div className="mt-10 flex items-center justify-center gap-6 text-sm text-indigo-600">
              <button className="hover:underline">español (ES)</button>
              <button className="hover:underline">
                Ayuda y servicio al cliente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT IMAGE */}
      <div className="relative hidden lg:block">
        <Image
          alt="BeautySync login visual"
          src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}

function LoginCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border border-black/10 bg-white",
        "px-5 py-4 text-left",
        "hover:bg-black/[0.02] active:bg-black/[0.04]",
        "transition"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {/* icon */}
          <div className="mt-0.5 h-9 w-9 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
            {icon}
          </div>

          {/* text */}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-black truncate">{title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground truncate">
              {subtitle}
            </p>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-black/40 shrink-0" />
      </div>
    </button>
  );
}