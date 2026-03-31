"use client";

import { useState } from "react";
import { Check, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "../book/PublicHeader";

type Props = {
  branchName?: string | null;
  amountCents: number;
  code: string;
  onView?: () => void;
};

export function GiftCardOwned({
  branchName,
  amountCents,
  code,
  onView,
}: Props) {
  const [flipped, setFlipped] = useState(false);

  const amount = (amountCents / 100).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });

  const maskedCode = `${code.slice(0, 4)}-${code.slice(4, 8)}`;

  return (
    <>
      <PublicHeader />

      <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden ">
        {/* 🌈 BACKGROUND */}
        {/* 🌈 BACKGROUND FIXED */}
        <div className="absolute inset-0 z-10 overflow-hidden">
          {/* base */}
          <div className="absolute inset-0 bg-[#f8fafc]" />

          {/* gradient blobs */}
          <div className="absolute -top-40 -left-40 w-525 h-125 bg-blue-400 rounded-full blur-[120px] opacity-50" />
          <div className="absolute top-1/2 -translate-y-1/2 -right-40 w-525 h-[500px] bg-pink-400 rounded-full blur-[120px] opacity-50" />
          <div className="absolute bottom-[-200px] left-1/2 -translate-x-1/2 w-525 h-[600px] bg-orange-400 rounded-full blur-[140px] opacity-50" />

          {/* subtle overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/60" />

          {/* grain */}
          <div
            className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
            style={{
              backgroundImage:
                "url('https://grainy-gradients.vercel.app/noise.svg')",
            }}
          />
        </div>

        {/* CONTENT */}
        <div className="w-full max-w-md flex flex-col items-center gap-6 z-20 bg-white/80 pb-10 px-10 rounded-2xl">
        <h1 className="text-2xl font-semibold pb-5 pt-5">Belza</h1>
          {/* ICON */}
          <div className="relative flex items-center justify-center w-14 h-14 rounded-full overflow-hidden">
            {/* 🔥 GRADIENT BASE */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, #5b5bf7, #c14ef0)",
              }}
            />

            {/* 🔥 GLOW SUAVE */}
            <div className="absolute inset-0 bg-white/20 blur-xl opacity-40" />

            {/* 🔥 NOISE / TEXTURA OPCIONAL */}
            <div
              className="absolute inset-0 opacity-[0.1] mix-blend-overlay"
              style={{
                backgroundImage:
                  "url('https://grainy-gradients.vercel.app/noise.svg')",
              }}
            />

            {/* ICON */}
            <Check className="relative z-10 text-white w-6 h-6" strokeWidth={5} />
          </div>

          {/* TEXT */}
          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold text-black">
              Esta gift card ya es tuya
            </h1>
            <p className="text-sm text-black/70">
              Ya puedes usarla en el establecimiento
            </p>
          </div>

          {/* CARD */}
          <div
            className="w-[320px] h-[180px]"
            style={{ perspective: "1400px" }}
            onMouseEnter={() => setFlipped(true)}
            onMouseLeave={() => setFlipped(false)}
          >
            <motion.div
              className="relative w-full h-full"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{
                transformStyle: "preserve-3d",
                WebkitTransformStyle: "preserve-3d",
              }}
            >
              {/* FRONT */}
              <div
                className="absolute inset-0 rounded-3xl p-6 text-white flex flex-col justify-between shadow-2xl overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #5b5bf7, #c14ef0)",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(0deg) translateZ(1px)",
                  pointerEvents: "none",
                }}
              >
                <div className="absolute inset-0 bg-white/10 blur-2xl opacity-30" />

                <div className="relative z-10 flex flex-col justify-between h-full">
                  <p className="text-lg font-semibold opacity-90 truncate">
                    {branchName ?? "Tu negocio"}
                  </p>

                  <p className="text-3xl font-bold">{amount}</p>

                  <p className="text-xs opacity-80 font-mono tracking-widest">
                    {maskedCode}
                  </p>
                </div>
              </div>

              {/* BACK */}
              <div
                className="absolute inset-0 rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #ffffff, #f3f4f6)",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg) translateZ(1px)",
                  pointerEvents: "none",
                }}
              >
                <div className="absolute inset-0 bg-black/[0.03]" />
                <p className="relative z-10 text-2xl font-semibold tracking-tight text-black">
                  Belza
                </p>
              </div>
            </motion.div>
          </div>

          {/* ACTION */}
          {onView && (
            <Button
              onClick={onView}
              className="rounded-full w-full bg-black text-white hover:bg-black/90 py-6"
            >
              Explorar
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
