"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Smile } from "lucide-react";

import { useClientDraft } from "@/context/ClientDraftContext";
import { Button } from "@/components/ui/button";

function getInitials(name?: string | null) {
  if (!name) return "";

  const parts = name.trim().split(" ");

  if (parts.length === 1) return parts[0][0].toUpperCase();

  return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
}

export default function ClientForm() {
  const { state, dispatch } = useClientDraft();

  const initials = getInitials(state.name);

  const editable = state.editable ?? {
    name: true,
    email: true,
    phone: true,
  };

  return (
    <div className="space-y-6 px-3 py-5">
      {/* TITLE */}
      <div>
        <h2 className="text-2xl font-semibold">Detalles del cliente</h2>
        <p className="text-sm text-muted-foreground">
          Información básica del cliente
        </p>
      </div>

      {/* FORM CARD */}
      <div className="rounded-md bg-white overflow-hidden">
        <div className="p-6 space-y-8">
          {/* AVATAR */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar className="h-16 w-16">
                {state.avatarUrl ? <AvatarImage src={state.avatarUrl} /> : null}

                <AvatarFallback className="bg-black text-white text-xl">
                  {initials ? (
                    initials
                  ) : (
                    <Smile className="w-6 h-6 text-white" />
                  )}
                </AvatarFallback>
              </Avatar>
            </div>

            <div>
              <p className="font-semibold text-[16px] leading-tight">
                {state.name || "Nuevo cliente"}
              </p>
              <p className="text-xs text-muted-foreground">
                La imagen se genera automáticamente
              </p>
            </div>
          </div>

          {/* NOMBRE */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <Label className="font-medium text-gray-800">
                Nombre del cliente
              </Label>
              <span>{state.name?.length ?? 0}/255</span>
            </div>

            <EditableInput
              value={state.name}
              editable={editable.name}
              placeholder="Nombre del cliente"
              tooltip="Este cliente está vinculado a un usuario y no se puede modificar"
              onChange={(value) => dispatch({ type: "SET_NAME", value })}
            />
          </div>

          {/* EMAIL / TELÉFONO */}
          <div className="grid grid-cols-2 gap-5">
            {/* EMAIL */}
            <div className="space-y-2">
              <Label className="font-medium text-gray-800">
                Email (Opcional)
              </Label>

              <EditableInput
                value={state.email}
                editable={editable.email}
                placeholder="cliente@email.com"
                tooltip="El email pertenece a un usuario registrado"
                onChange={(value) => dispatch({ type: "SET_EMAIL", value })}
              />

              <p className="text-[11px] text-gray-500">
                Para recordatorios y confirmaciones.
              </p>
            </div>

            {/* PHONE */}
            <div className="space-y-2">
              <Label className="font-medium text-gray-800">
                Teléfono (Opcional)
              </Label>

              <EditableInput
                value={state.phone}
                editable={editable.phone}
                placeholder="+52 33 1234 5678"
                tooltip="Este teléfono pertenece a una cuenta"
                onChange={(value) => dispatch({ type: "SET_PHONE", value })}
              />

              <p className="text-[11px] text-gray-500">
                Para contacto directo o WhatsApp.
              </p>
            </div>
          </div>

          {/* NOTAS */}
          <div className="space-y-2">
            <Label className="font-medium text-gray-800">
              Notas del cliente (Opcional)
            </Label>

            <Textarea
              rows={4}
              className="resize-none shadow-none"
              placeholder="Información adicional sobre el cliente..."
              value={state.notes ?? ""}
              onChange={(e) =>
                dispatch({ type: "SET_NOTES", value: e.target.value })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

type Props = {
  value?: string | null;
  placeholder?: string;
  editable?: boolean;
  tooltip?: string;
  onChange?: (value: string) => void;
};

export function EditableInput({
  value,
  placeholder,
  editable = true,
  tooltip,
  onChange,
}: Props) {
  if (!editable) {
    return (
      <Button
        tooltip={tooltip ?? "Este campo no se puede editar"}
        variant="outline"
        className="h-12 w-full justify-start text-left font-normal bg-gray-50 border border-input text-foreground cursor-not-allowed"
      >
        {value || placeholder || "—"}
      </Button>
    );
  }

  return (
    <Input
      className="h-12 shadow-none"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}
