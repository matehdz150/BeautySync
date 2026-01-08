"use client";

import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function StepBranchInfo({
  branchName,
  setBranchName,
  branchAddress,
  setBranchAddress,
}: any) {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 flex flex-col items-center"
    >
      {/* 🔥 WRAPPER CON ANCHO UNIFICADO */}
      <div className="w-full max-w-xl space-y-8">
        {/* HEADER */}
        <div className="flex flex-col items-start">
          <p className="text-sm text-gray-500">Sucursal principal</p>

          <h2 className="text-3xl font-bold mt-2">
            Agrega tu primera sucursal
          </h2>

          <p className="text-gray-500 mt-2 text-left">
            Puedes crear más sucursales después.
            <br />
            Esta será tu ubicación principal de trabajo.
          </p>
        </div>

        {/* FORM */}
        <div className="space-y-4 text-left">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Nombre de la sucursal
            </Label>

            <Input
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="Ej. Sucursal Roma"
              className="h-14 text-base border-2 shadow-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Dirección (opcional)
            </Label>

            <Input
              value={branchAddress}
              onChange={(e) => setBranchAddress(e.target.value)}
              placeholder="Ej. Av. Álvaro Obregón 123"
              className="h-14 text-base border-2 shadow-none"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}