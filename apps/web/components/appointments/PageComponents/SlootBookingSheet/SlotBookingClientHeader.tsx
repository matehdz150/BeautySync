"use client";

import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useBranch } from "@/context/BranchContext";
import { useSlotBooking } from "@/context/SlotBookingContext";
import { SlotBookingClientSelector } from "./SlotBookingClientSelector";

/* =========================
   Component
========================= */

export function SlotBookingClientHeader() {
  const [open, setOpen] = useState(false);

  const { branch } = useBranch();
  const { state, actions } = useSlotBooking();

  const client = state.client;

  if (!branch) return null;

  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait" initial={false}>
        {/* ================= SIN CLIENTE ================= */}
        {!open && !client && (
          <motion.button
            key="add-client"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(true)}
            className="
              w-full flex items-center gap-3
              px-6 py-3
              hover:bg-indigo-50
              transition
            "
          >
            <div className="flex items-center justify-center h-10 w-10 bg-indigo-100 rounded-full">
              <UserPlus className="h-5 w-5 text-indigo-500" />
            </div>

            <div className="text-left">
              <div className="font-semibold">Add client</div>
              <div className="text-xs text-muted-foreground">
                Optional · Walk-ins allowed
              </div>
            </div>
          </motion.button>
        )}

        {/* ================= CLIENTE SELECCIONADO ================= */}
        {!open && client && (
          <motion.div
            key="client-selected"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="
              flex items-center justify-between
              px-6 py-3
              bg-muted/40
            "
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 bg-indigo-100 rounded-full">
                <UserPlus className="h-5 w-5 text-indigo-500" />
              </div>

              <div>
                <div className="font-semibold">{client.name}</div>
                <div className="text-xs text-muted-foreground">
                  Client selected
                </div>
              </div>
            </div>

            <button
              onClick={() => actions.clearClient()}
              className="text-muted-foreground hover:text-destructive"
              title="Remove client"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* ================= SELECTOR ================= */}
        {open && (
          <motion.div
            key="client-selector"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="px-4 py-3"
          >
            <SlotBookingClientSelector
              orgId={branch.organizationId}
              clientId={client?.id}
              onSelect={(c) => {
                actions.setClient(c);
                setOpen(false);
              }}
              onClose={() => setOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}