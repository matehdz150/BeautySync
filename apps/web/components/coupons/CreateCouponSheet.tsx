"use client";

import { useMemo, useState } from "react";
import { CalendarIcon, Percent, Tag, TicketPercent } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useCouponDraft } from "@/context/CouponDraftContext";
import { useBranch } from "@/context/BranchContext";
import { createCoupon } from "@/lib/services/coupons";
import { CouponCard } from "@/app/dashboard/services/overview/coupons/CouponCard";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CouponUserSelect } from "./CouponUserSelect";
import { CouponServicesSelect } from "./CouponServicesSelect";

export function CreateCouponSheet({
  onCreated,
}: {
  onCreated?: () => void | Promise<void>;
}) {
  const { branch } = useBranch();
  const { isOpen, close, draft, update, reset } = useCouponDraft();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewDiscount = useMemo(() => {
    if (!draft.value || draft.value <= 0) {
      return draft.type === "percentage" ? "0%" : "$0";
    }

    return draft.type === "percentage"
      ? `${draft.value}%`
      : `$${draft.value.toLocaleString("es-MX")}`;
  }, [draft.type, draft.value]);

  const previewCode = useMemo(() => {
    return draft.code?.trim() || "WELCOME20";
  }, [draft.code]);

  function handleClose() {
    close();
    setError(null);
  }

  async function handleCreate() {
    try {
      setError(null);

      if (!branch?.id) return setError("Sucursal inválida");
      if (!draft.code.trim()) return setError("Código requerido");
      if (!draft.value || draft.value <= 0) return setError("Valor inválido");
      if (draft.type === "percentage" && draft.value > 100)
        return setError("Máximo 100%");

      setLoading(true);

      await createCoupon({
        branchId: branch.id,
        code: draft.code.trim().toUpperCase(),
        type: draft.type,
        value: draft.value,
        minAmountCents: draft.minAmountCents || undefined,
        maxDiscountCents:
          draft.type === "percentage"
            ? draft.maxDiscountCents || undefined
            : undefined,
        usageLimit: draft.usageLimit || undefined,
        assignedToUserId: draft.assignedToUserId || undefined,
        expiresAt: draft.expiresAt ? draft.expiresAt.toISOString() : undefined,
        serviceIds: draft.serviceIds?.length ? draft.serviceIds : undefined,
      });

      reset();
      close();
      await onCreated?.();
    } catch (e: any) {
      setError(e?.message ?? "No se pudo crear el cupón");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        side="right"
        className="w-[560px] sm:max-w-[560px] overflow-visible p-0"
      >
        <div className="h-full flex flex-col">
          {/* HEADER */}
          <SheetHeader className="px-5 pt-5 pb-2 shrink-0">
            <SheetTitle>Crear cupón</SheetTitle>
          </SheetHeader>

          {/* 🔥 SCROLL */}
          <div className="flex-1 overflow-y-auto px-5 pb-10">
            <div className="mt-6 flex flex-col gap-6">
              {/* PREVIEW */}
              <div className="flex justify-center">
                <CouponCard
                  title="CUPÓN DE DESCUENTO"
                  subtitle="VOUCHER"
                  branchName={branch?.name ?? "Belza"}
                  code={previewCode}
                  discount={previewDiscount}
                />
              </div>

              {/* TYPE */}
              <div className="flex flex-col gap-3">
                <Label>Tipo de descuento</Label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        type: "percentage",
                        maxDiscountCents: undefined,
                      })
                    }
                    className={`rounded-2xl border px-4 py-4 text-left ${
                      draft.type === "percentage"
                        ? "border-black bg-black text-white"
                        : "border-border bg-white hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      <span>Porcentaje</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      update({
                        type: "fixed",
                        maxDiscountCents: undefined,
                      })
                    }
                    className={`rounded-2xl border px-4 py-4 text-left ${
                      draft.type === "fixed"
                        ? "border-black bg-black text-white"
                        : "border-border bg-white hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      <span>Monto fijo</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* BASIC */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex flex-col gap-2">
                  <Label>Código</Label>
                  <Input
                    value={draft.code}
                    onChange={(e) =>
                      update({
                        code: e.target.value.toUpperCase().replace(/\s+/g, ""),
                      })
                    }
                    className="py-6"
                    placeholder="Ej. WELCOME20"
                  />
                  <p className="text-xs text-muted-foreground">
                    Es el código que el cliente escribirá al pagar
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    value={draft.value || ""}
                    onChange={(e) =>
                      update({
                        value: Number(e.target.value || 0),
                      })
                    }
                    className="py-6"
                    placeholder={
                      draft.type === "percentage" ? "Ej. 20%" : "Ej. 200 MXN"
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {draft.type === "percentage"
                      ? "Porcentaje que se descontará del total."
                      : "Cantidad en pesos que se descontará de la compra."}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Monto mínimo</Label>
                  <Input
                    type="number"
                    value={
                      draft.minAmountCents
                        ? Math.round(draft.minAmountCents / 100)
                        : ""
                    }
                    onChange={(e) =>
                      update({
                        minAmountCents: e.target.value
                          ? Number(e.target.value) * 100
                          : undefined,
                      })
                    }
                    className="py-6"
                    placeholder="Ej 200"
                  />
                  <p className="text-xs text-muted-foreground">
                    El cupón solo se aplicará si la compra supera este monto.
                  </p>
                </div>
              </div>

              {/* ADVANCED */}
              <div className="grid grid-cols-2 gap-4">
                {draft.type === "percentage" && (
                  <div className="flex flex-col gap-2">
                    <Label>Descuento máximo</Label>
                    <Input
                      type="number"
                      value={
                        draft.maxDiscountCents
                          ? Math.round(draft.maxDiscountCents / 100)
                          : ""
                      }
                      onChange={(e) =>
                        update({
                          maxDiscountCents: e.target.value
                            ? Number(e.target.value) * 100
                            : undefined,
                        })
                      }
                      className="py-6"
                      placeholder="Ej. 20%"
                    />
                    <p className="text-xs text-muted-foreground">
                      Limita el descuento cuando usas porcentaje, para evitar
                      descuentos muy grandes.
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Label>Límite de usos</Label>
                  <Input
                    type="number"
                    value={draft.usageLimit || ""}
                    onChange={(e) =>
                      update({
                        usageLimit: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="py-6"
                    placeholder="Ej. 50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cuántas veces puede usarse este cupón en total.
                  </p>
                </div>
              </div>

              {/* 🔥 OPCIONES ADICIONALES */}
              <div className="rounded-2xl border p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <TicketPercent className="w-4 h-4" />
                  <p className="font-medium">Opciones adicionales</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <CouponUserSelect />

                  <div className="flex flex-col gap-2">
                    <Label>Expira el</Label>

                    <div className="flex gap-2">
                      {/* 📅 DATE PICKER */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !draft.expiresAt && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {draft.expiresAt
                              ? format(draft.expiresAt, "PPP")
                              : "Seleccionar fecha"}
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={draft.expiresAt ?? undefined}
                            onSelect={(date) => {
                              if (!date) return;

                              const current = draft.expiresAt ?? new Date();

                              const newDate = new Date(date);
                              newDate.setHours(
                                current.getHours(),
                                current.getMinutes(),
                              );

                              update({ expiresAt: newDate });
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      {/* ⏰ TIME PICKER */}
                      <Input
                        type="time"
                        value={
                          draft.expiresAt
                            ? format(draft.expiresAt, "HH:mm")
                            : ""
                        }
                        onChange={(e) => {
                          if (!e.target.value) {
                            update({ expiresAt: null });
                            return;
                          }

                          const [hours, minutes] = e.target.value.split(":");

                          const base = draft.expiresAt ?? new Date();

                          const newDate = new Date(base);
                          newDate.setHours(Number(hours), Number(minutes));

                          update({ expiresAt: newDate });
                        }}
                        className="w-[120px]"
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Después de esta fecha el cupón dejará de ser válido.
                    </p>
                  </div>
                </div>
              </div>

              {/* SERVICES */}
              <div className="rounded-2xl border p-4">
                <CouponServicesSelect />
              </div>

              {/* ERROR */}
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={handleClose}>
                  Cancelar
                </Button>

                <Button onClick={handleCreate} disabled={loading}>
                  {loading ? "Creando..." : "Crear"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
