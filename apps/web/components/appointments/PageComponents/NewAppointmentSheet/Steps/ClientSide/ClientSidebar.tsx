"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { ClientSelector } from "./ClientSelector";
import { SelectedClientCard } from "./SelectedClientCard";
import { useBranch } from "@/context/BranchContext";
import { useAppointmentBuilder } from "@/context/AppointmentBuilderContext";

export function ClientSidebar() {
  const [open, setOpen] = useState(false);
  const { client, setClient } = useAppointmentBuilder();
  const { branch } = useBranch();

  return (
    <aside className="w-80 border-r flex flex-col h-full relative overflow-hidden">

      <AnimatePresence mode="wait" initial={false}>

        {/* ⭐ SIN CLIENTE — BOTÓN */}
        {!open && !client && (
          <motion.div
            key="add"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-center gap-3 w-full h-full"
          >
            <button
              onClick={() => setOpen(true)}
              className="flex flex-col items-center gap-3 cursor-pointer hover:bg-indigo-50 w-full h-full pt-8"
            >
              <div className="flex items-center justify-center h-14 w-14 bg-indigo-100 rounded-full">
                <UserPlus className="h-7 w-7 text-indigo-500" />
              </div>

              <h2 className="font-semibold">Add client</h2>

              <p className="text-sm text-center text-muted-foreground">
                Or leave empty for walk-ins
              </p>
            </button>
          </motion.div>
        )}

        {/* ⭐ CLIENTE SELECCIONADO */}
        {!open && client && (
          <motion.div
            key="selected"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.18 }}
            className="w-full h-full"
          >
            <SelectedClientCard
              client={client}
              onClear={() => setClient(undefined)}
            />
          </motion.div>
        )}

        {/* ⭐ SELECTOR */}
        {open && (
          <motion.div
            key="selector"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.18 }}
            className="w-full h-full"
          >
            <ClientSelector
              orgId={branch!.organizationId}
              clientId={client?.id}
              onSelect={(c) => setClient(c)}
              onClose={() => setOpen(false)}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </aside>
  );
}