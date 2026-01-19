"use client";

import { useState } from "react";
import { RefreshCw, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCalendar } from "@/context/CalendarContext";

type Status = "idle" | "spinning" | "success";

export function CalendarRefreshButton() {
  const { reload } = useCalendar();
  const [status, setStatus] = useState<Status>("idle");

  async function handleReload() {
    if (status !== "idle") return;

    setStatus("spinning");
    await reload(); // 👈 el reload ocurre DURANTE el giro
  }

  return (
    <Button
      variant="outline"
      className="rounded-full shadow-none w-9 h-9 p-0"
      tooltip="Refrescar calendario"
      onClick={handleReload}
      disabled={status !== "idle"}
    >
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            <RefreshCw className="w-4 h-4" />
          </motion.div>
        )}

        {status === "spinning" && (
          <motion.div
            key="spinning"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            onAnimationComplete={() => {
              setStatus("success");

              // ⏱️ mostrar check y volver a idle
              setTimeout(() => {
                setStatus("idle");
              }, 1200);
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            key="success"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
          >
            <Check className="w-4 h-4 " />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}