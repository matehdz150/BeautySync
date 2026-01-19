"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown, User, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Client, usePayment } from "@/context/PaymentContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClientSelectDropdown } from "./ClientSelectDropdown";

type ClientSummaryProps = {
  client?: Client;
  onAddClient?: () => void;
  onActionsClick?: () => void;
  className?: string;
};

export function ClientSummary({
  client,
  onAddClient,
  onActionsClick,
  className,
}: ClientSummaryProps) {

    const {dispatch} = usePayment()
  /* =========================
     ❌ SIN CLIENTE
  ========================= */
  if (!client) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-4 border rounded-xl p-4 bg-white w-full",
          className
        )}
      >
        {/* LEFT */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
            <UserPlus className="h-6 w-6 text-indigo-400" />
          </div>

          <div className="leading-tight">
            <p className="text-base font-semibold">Agregar cliente</p>
            <p className="text-sm text-muted-foreground">
              O dejar vacío para clientes sin cita
            </p>
          </div>
        </div>

        {/* ACTION */}
        <ClientSelectDropdown
          onSelect={(client) => {
            dispatch({
              type: "SET_CLIENT",
              payload: client,
            });
          }}
        />
      </div>
    );
  }

  /* =========================
     ✅ CON CLIENTE
  ========================= */
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border rounded-xl p-4 bg-white w-full",
        className
      )}
    >
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10 ">
          <AvatarFallback className="bg-indigo-400 text-white">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>

        <div className="space-y-0.5">
          <p className="text-base font-semibold leading-tight">{client.name}</p>

          {client.email && (
            <p className="text-sm text-muted-foreground">{client.email}</p>
          )}
        </div>
      </div>

      {/* ACTION */}
      <Button
        variant="outline"
        size="sm"
        className="rounded-full px-4 gap-2 font-normal shadow-none"
        onClick={onActionsClick}
      >
        Actions
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
