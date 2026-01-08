"use client";

import { motion } from "framer-motion";
import { PartyPopper } from "lucide-react";

export function StepDone({ onFinish }: { onFinish: () => void }) {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35 }}
      onAnimationComplete={() => {
        setTimeout(onFinish, 2500);
      }}
      className="flex flex-col items-center text-center space-y-6"
    >
      {/* ICON */}
      <div className="p-4 rounded-full bg-green-100">
        <PartyPopper className="h-10 w-10 text-green-600" />
      </div>

      {/* TEXT BLOCK */}
      <div className="max-w-xl space-y-2">
        <h2 className="text-3xl font-bold">
          ¡Todo listo!
        </h2>

        <p className="text-gray-500 text-base">
          Tu espacio de trabajo ha sido creado correctamente.
          <br />
          Te estamos redirigiendo a tu panel…
        </p>
      </div>
    </motion.div>
  );
}