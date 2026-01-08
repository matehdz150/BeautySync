"use client";

import { Mail, Phone, User, X } from "lucide-react";
import type { Client as SelectedClient } from "@/context/AppointmentBuilderContext";

export function SelectedClientCard({
  client,
  onClear,
}: {
  client?: SelectedClient;
  onClear: () => void;
}) {
  // si no hay cliente, mostramos una tarjeta con defaults
  if (!client) {
    return (
      <aside className="w-80 border-r flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold text-lg">Cliente seleccionado</h2>

        </div>

        <div className="flex flex-col items-center px-6 py-6 gap-4">
          <div className="h-20 w-20 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
            <User className="h-10 w-10" />
          </div>

          <p className="font-semibold text-xl">Cliente sin nombre</p>

          <div className="w-full space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>Sin teléfono</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>Sin correo</span>
            </div>
          </div>

          <button
            onClick={onClear}
            className="w-full mt-4 border rounded-xl py-2 text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition"
          >
            Quitar cliente
          </button>
        </div>
      </aside>
    );
  }

  // cliente con datos reales
  const { name, email, phone, avatarUrl } = client;

  return (
    <aside className="w-80 border-r flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="font-semibold text-lg">Cliente seleccionado</h2>
      </div>

      <div className="flex flex-col items-center px-6 py-6 gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            className="h-20 w-20 rounded-full object-cover shadow-sm"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
            <User className="h-10 w-10" />
          </div>
        )}

        <p className="font-semibold text-xl">
          {name || "Cliente sin nombre"}
        </p>

        <div className="w-full space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{phone || "Sin teléfono"}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{email || "Sin correo"}</span>
          </div>
        </div>

        <button
          onClick={onClear}
          className="w-full mt-4 border rounded-xl py-2 text-sm font-medium hover:bg-[#f6f6f6] transition"
        >
          Deseleccionar cliente
        </button>
      </div>
    </aside>
  );
}