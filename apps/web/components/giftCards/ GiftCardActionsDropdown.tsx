"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { resendGiftCard, cancelGiftCard } from "@/lib/services/gift-cards";
import { GiftCard } from "@/lib/services/gift-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  card: GiftCard;
  onReload?: () => void;
};

export function GiftCardActionsDropdown({ card, onReload }: Props) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [loading, setLoading] = useState(false);

  const [resendModal, setResendModal] = useState(false);
  const [email, setEmail] = useState(card.issuedToEmail ?? "");

  /* =========================
     ACTIONS
  ========================= */

  async function handleCancel() {
    try {
      setLoading(true);
      await cancelGiftCard(card.id);
      setConfirmCancel(false);
      onReload?.();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      setLoading(true);

      await resendGiftCard({
        giftCardId: card.id,
        email: email || undefined,
      });

      setResendModal(false);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     UI
  ========================= */

  return (
    <>
      {/* 🔥 DROPDOWN */}
      <div className="flex">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-md hover:bg-muted">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(card.code)}
            >
              Copiar código
            </DropdownMenuItem>

            <DropdownMenuItem>
              Ver detalle
            </DropdownMenuItem>

            {/* 🔁 RESEND */}
            {card.issuedToEmail && (
              <DropdownMenuItem onClick={() => setResendModal(true)}>
                Reenviar
              </DropdownMenuItem>
            )}

            {!card.ownerUser && (
              <DropdownMenuItem>Asignar cliente</DropdownMenuItem>
            )}

            {card.ownerUser && (
              <DropdownMenuItem>Desasignar</DropdownMenuItem>
            )}

            {/* ❌ CANCEL */}
            {confirmCancel ? (
              <>
                <DropdownMenuItem
                  onClick={handleCancel}
                  className="text-red-600"
                >
                  {loading ? "Cancelando..." : "Confirmar cancelación"}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setConfirmCancel(false)}>
                  Cancelar
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem
                onClick={() => setConfirmCancel(true)}
                className="text-red-600"
              >
                Cancelar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 🔥 MODAL RESEND */}
      {resendModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[400px] flex flex-col gap-4">
            <h2 className="text-lg font-semibold">
              Reenviar gift card
            </h2>

            <p className="text-sm text-muted-foreground">
              Puedes cambiar el correo antes de enviarla
            </p>

            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="shadow-none py-6"
            />

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setResendModal(false)}
              >
                Cancelar
              </Button>

              <Button
                onClick={handleResend}
                disabled={loading}
              >
                {loading ? "Enviando..." : "Reenviar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}