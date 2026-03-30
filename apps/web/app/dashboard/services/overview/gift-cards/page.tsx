"use client";

import { useEffect, useState } from "react";
import {
  getGiftCardsByBranch,
  createGiftCard,
  GiftCard,
} from "@/lib/services/gift-cards";

import { useBranch } from "@/context/BranchContext";
import { Button } from "@/components/ui/button";
import { ChevronDown, Filter, MoreHorizontal, Search } from "lucide-react";

/* 🔥 CONTEXT */
import {
  GiftCardDraftProvider,
  useGiftCardDraft,
} from "@/context/GiftCardDraftContext";

/* 🔥 SHEET */
import { CreateGiftCardSheet } from "@/components/giftCards/CreateGiftCardSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/* =========================
   MAIN PAGE
========================= */
function GiftCardsPage() {
  const { branch } = useBranch();
  const { open } = useGiftCardDraft();

  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFilters, setOpenFilters] = useState(false);

  function getInitials(name?: string | null) {
    if (!name) return "?";

    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0];

    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  async function load() {
    if (!branch) return;

    try {
      setLoading(true);
      const data = await getGiftCardsByBranch(branch.id);
      console.log(data);
      setGiftCards(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [branch]);

  if (loading) {
    return <div className="p-6">Cargando gift cards...</div>;
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gift Cards</h1>
          <p className="text-base text-muted-foreground font-light">
            Administra las gift cards de tu sucursal
          </p>
        </div>

        {/* CREATE */}
        <div className="flex gap-2 items-center">
          <Button className="rounded-full" variant={"primary"} onClick={open}>
            Agregar
            <ChevronDown />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {/* 🔍 SEARCH */}
          <div className="relative w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

            <Input
              className="pl-10 border rounded-2xl bg-white shadow-none"
              placeholder="Buscar por código o cliente…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ========================= */}
      {/* EMPTY STATE */}
      {/* ========================= */}
      {giftCards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
          {/* 🔥 DEMO CARD */}
          <div
            className="w-[320px] h-[180px] rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg"
            style={{
              background: "linear-gradient(135deg, #5b5bf7, #c14ef0)",
            }}
          >
            <p className="text-lg font-semibold opacity-90">
              {branch?.name ?? "Tu negocio"}
            </p>

            <p className="text-3xl font-bold">$500</p>

            <p className="text-xs opacity-80 font-mono">XXXX-XXXX</p>
          </div>

          {/* 🔥 TEXT */}
          <div>
            <p className="text-lg font-medium">No tienes gift cards</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crea la primera para empezar a vender crédito a tus clientes
            </p>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* LIST */}
      {/* ========================= */}
      {giftCards.length > 0 && (
        <div className=" rounded-2xl overflow-hidden">
          {/* ========================= */}
          {/* HEADER */}
          {/* ========================= */}
          <div className="grid grid-cols-7 gap-4 px-6 py-3 text-base font-medium text-black ">
            <span>Gift Card</span>
            <span>Código</span>
            <span>Cliente</span>
            <span>Saldo</span>
            <span>Inicial</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>

          {/* ========================= */}
          {/* ROWS */}
          {/* ========================= */}
          {giftCards.map((card) => {
            const balance = (card.balanceCents / 100).toFixed(2);
            const initial = (card.initialAmountCents / 100).toFixed(2);

            return (
              <div
                key={card.id}
                className="grid grid-cols-7 gap-4 items-center px-6 py-3 border-t hover:bg-muted/40 transition border-b"
              >
                {/* 🔥 MINI CARD */}
                <div
                  className="w-[100px] h-[62px] rounded-md px-2 py-1.5 text-white flex flex-col justify-between"
                  style={{
                    background: "linear-gradient(135deg, #5b5bf7, #c14ef0)",
                  }}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-[8px] opacity-80 truncate max-w-[60px]">
                      {branch?.name ?? "Gift"}
                    </p>

                    <span className="text-[7px] opacity-70">MXN</span>
                  </div>

                  <p className="text-[11px] font-semibold leading-none">
                    ${balance}
                  </p>

                  <p className="text-[7px] opacity-70 font-mono truncate">
                    {card.code.slice(0, 8)}
                  </p>
                </div>

                {/* CODE */}
                <div className="text-sm font-mono truncate">{card.code}</div>

                {/* CLIENT */}
                <div className="text-sm">
                  {card.ownerUser ? (
                    <Button
                      variant="ghost"
                      tooltip={card.ownerUser.email ?? "Sin email"}
                      className="h-auto px-2 py-1 flex items-center gap-2 justify-start"
                    >
                      {/* AVATAR */}
                      <Avatar className="w-12 h-12">
                        {card.ownerUser.avatarUrl && (
                          <AvatarImage src={card.ownerUser.avatarUrl} />
                        )}

                        <AvatarFallback className="bg-indigo-100 text-xs">
                          {getInitials(card.ownerUser.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Sin asignar
                    </span>
                  )}
                </div>

                {/* BALANCE */}
                <div className="text-sm font-semibold">${balance}</div>

                {/* INITIAL */}
                <div className="text-sm text-muted-foreground">${initial}</div>

                {/* STATUS */}
                <div>
                  <span
                    className={`
                text-xs px-2 py-1 rounded-full
                ${
                  card.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-700"
                }
              `}
                  >
                    {card.status}
                  </span>
                </div>

                {/* ACTIONS */}
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

                      <DropdownMenuItem
                        onClick={() => console.log("ver detalle", card.id)}
                      >
                        Ver detalle
                      </DropdownMenuItem>

                      {!card.ownerUser && (
                        <DropdownMenuItem
                          onClick={() =>
                            console.log("asignar cliente", card.id)
                          }
                        >
                          Asignar cliente
                        </DropdownMenuItem>
                      )}

                      {card.ownerUser && (
                        <DropdownMenuItem
                          onClick={() => console.log("desasignar", card.id)}
                        >
                          Desasignar
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() => console.log("cancelar", card.id)}
                        className="text-red-600"
                      >
                        Cancelar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================= */}
      {/* SHEET */}
      {/* ========================= */}
      <CreateGiftCardSheet onCreated={load} />
    </div>
  );
}

/* =========================
   WRAPPER (CONTEXT)
========================= */
export default function PageWrapper() {
  return (
    <GiftCardDraftProvider>
      <GiftCardsPage />
    </GiftCardDraftProvider>
  );
}
