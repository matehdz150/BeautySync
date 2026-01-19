"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { ClientSelector } from "./ClientSelector";
import { SelectedClientCard } from "./SelectedClientCard";
import { useBranch } from "@/context/BranchContext";
import { useAppointmentBuilder } from "@/context/AppointmentBuilderContext";

export function ClientHeaderBar() {
  const [open, setOpen] = useState(false);
  const { client, setClient } = useAppointmentBuilder();
  const { branch } = useBranch();

  return (
    <div className="relative w-full">

      <AnimatePresence mode="wait" initial={false}>

        {/* ⭐ SIN CLIENTE */}
        {!open && !client && (
          <motion.button
            key="add"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(true)}
            className="flex items-center gap-3 px-9 hover:bg-indigo-50 w-full h-full py-4"
          >
            <div className="flex items-center justify-center h-10 w-10 bg-indigo-100 rounded-full">
              <UserPlus className="h-5 w-5 text-indigo-500" />
            </div>

            <div className="text-left">
              <h3 className="font-semibold">Add client</h3>
              <p className="text-xs text-muted-foreground">
                Or leave empty for walk-ins
              </p>
            </div>
          </motion.button>
        )}

        {/* ⭐ CLIENTE SELECCIONADO */}
        {!open && client && (
          <motion.div
            key="selected"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
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
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
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
    </div>
  );
}