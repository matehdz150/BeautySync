"use client";

import { useState } from "react";
import { UserPlus, X, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useBranch } from "@/context/BranchContext";
import { useSlotBooking } from "@/context/SlotBookingContext";
import { SlotBookingClientSelector } from "./SlotBookingClientSelector";

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
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={() => setOpen(true)}
            className="
              w-full flex items-center gap-4
              rounded-xl border border-dashed
              px-4 py-3
              bg-white
              hover:border-indigo-400 hover:bg-indigo-50/40
              transition
            "
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <UserPlus className="h-5 w-5" />
            </div>

            <div className="text-left flex-1">
              <p className="font-semibold text-sm">Agregar cliente</p>
              <p className="text-xs text-muted-foreground">
                Opcional · Se permiten clientes sin registro
              </p>
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
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="
              flex items-center justify-between gap-4
              rounded-xl border
              px-4 py-3
              bg-muted/40
            "
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="
    flex h-11 w-11 items-center justify-center
    rounded-full border overflow-hidden
    bg-indigo-100
  "
              >
                {client.avatarUrl ? (
                  <img
                    src={client.avatarUrl}
                    alt={client.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-indigo-600" />
                )}
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{client.name}</p>
                <p className="text-xs text-muted-foreground">
                  Cliente seleccionado
                </p>
              </div>
            </div>

            <button
              onClick={() => actions.clearClient()}
              className="
                flex h-8 w-8 items-center justify-center
                rounded-full
                text-muted-foreground
                hover:text-destructive hover:bg-destructive/10
                transition
              "
              title="Quitar cliente"
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
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="
              mt-2 rounded-xl border
              bg-white
              px-4 py-4
            "
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
