"use client";

import { useGiftCardDraft } from "@/context/GiftCardDraftContext";
import { createGiftCard } from "@/lib/services/gift-cards";
import { useBranch } from "@/context/BranchContext";
import { useEffect, useState } from "react";

/* 🔥 SHADCN */
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import ClientSelect from "./ClientSelect";

export function CreateGiftCardSheet({ onCreated }: { onCreated: () => void }) {
  const { state, close, setAmount, reset, setMode, setEmail } =
    useGiftCardDraft();
  const { branch } = useBranch();

  const [loading, setLoading] = useState(false);

  /* =========================
     CREATE
  ========================= */
  async function handleCreate() {
    if (!branch) return;

    const cents = Math.round(Number(state.amount) * 100);
    if (!cents || cents <= 0) return;

    try {
      setLoading(true);

      const payload: any = {
        branchId: branch.id,
        initialAmountCents: cents,
      };

      if (state.mode === "email" && !state.email) {
        alert("Ingresa un correo");
        return;
      }

      // =========================
      // 🎯 MODE: CLIENT
      // =========================
      if (state.mode === "client") {
        if (state.publicUserId) {
          payload.ownerUserId = state.publicUserId;
        }

        if (state.sendEmail && state.email) {
          payload.issuedToEmail = state.email;
        }
      }

      // =========================
      // 📧 MODE: EMAIL
      // =========================
      if (state.mode === "email") {
        if (!state.email) return; // opcional: mejor validar bonito

        payload.issuedToEmail = state.email;
      }

      console.log(payload)

      await createGiftCard(payload);

      reset();
      onCreated();
      close();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={state.isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="right" className="flex flex-col gap-6 px-5">
        {/* HEADER */}
        <SheetHeader>
          <SheetTitle>Crear Gift Card</SheetTitle>
        </SheetHeader>

        {/* PREVIEW CARD */}
        <div
          className="rounded-3xl p-6 text-white"
          style={{
            background: "linear-gradient(135deg, #5b5bf7, #c14ef0)",
          }}
        >
          <p className="text-lg font-semibold">{branch?.name}</p>

          <p className="text-3xl font-bold mt-4">
            ${Number(state.amount || 0).toLocaleString()}
          </p>
        </div>

        {/* INPUT MONTO */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Monto</p>

          <Input
            type="number"
            placeholder="Ej: 500"
            value={state.amount}
            className="shadow-none py-6"
            min={1}
            max={10000}
            onChange={(e) => {
              const value = e.target.value;

              // permitir vacío (para borrar)
              if (value === "") {
                setAmount("");
                return;
              }

              const num = Number(value);

              // 🔥 clamp
              if (num < 1) {
                setAmount("1");
                return;
              }

              if (num > 10000) {
                setAmount("10000");
                return;
              }

              setAmount(value);
            }}
          />

          <div className="flex flex-wrap gap-2 mt-2">
            {[100, 200, 500, 1000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(String(val))}
                className="px-5 py-3 text-sm rounded-full border hover:bg-black hover:text-white transition"
              >
                ${val}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("client")}
              className={`px-4 py-2 rounded-full border ${
                state.mode === "client" ? "bg-black text-white" : ""
              }`}
            >
              Cliente
            </button>

            <button
              onClick={() => setMode("email")}
              className={`px-4 py-2 rounded-full border ${
                state.mode === "email" ? "bg-black text-white" : ""
              }`}
            >
              Email
            </button>
          </div>

          {/* 🔥 DESCRIPCIÓN */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {state.mode === "client" &&
              "Asigna la gift card a un cliente existente. Podrá usarla directamente en su cuenta."}

            {state.mode === "email" &&
              "Envía la gift card por correo. El destinatario podrá reclamarla y crear una cuenta si no tiene."}
          </p>
        </div>

        {state.mode === "client" && <ClientSelect />}

        {state.mode === "email" && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Enviar por correo</p>
            <Input
              placeholder="correo@ejemplo.com"
              value={state.email}
              onChange={(e) => setEmail(e.target.value)}
              className="py-6 shadow-none"
            />
          </div>
        )}

        {/* ACTION */}
        <Button
          onClick={handleCreate}
          disabled={loading}
          className="rounded-full py-6"
        >
          {loading ? "Creando..." : "Crear"}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
