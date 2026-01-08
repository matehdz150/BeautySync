"use client";

import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function StepBusinessInfo({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 flex flex-col items-center"
    >
      {/* HEADER — MISMO MAX WIDTH QUE EL INPUT */}
      <div className="max-w-xl w-full flex flex-col items-start">
        <p className="text-base text-gray-500">Configuración de cuenta</p>

        <h2 className="text-4xl font-bold mt-2">
          ¿Cómo se llama tu negocio?
        </h2>

        <p className="text-gray-500 mt-4 text-base">
          Este es el nombre comercial que verán tus clientes.
          <br />
          Más adelante podrás añadir la razón social.
        </p>
      </div>

      {/* INPUT FIELD */}
      <div className="space-y-2 max-w-xl w-full text-left">
        <Label className="text-sm font-medium">Nombre del negocio</Label>

        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ej. BeautySync Roma"
          className="h-14 text-base border-2 shadow-none"
        />
      </div>
    </motion.div>
  );
}