"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EllipsisVertical, Percent, Ticket, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePayment } from "@/context/PaymentContext";

type DiscountType = "percentage" | "fixed";

export function DiscountMenu() {
  const [openDialog, setOpenDialog] = useState(false);
  const [type, setType] = useState<DiscountType>("percentage");
  const [value, setValue] = useState("");
  const { dispatch, subtotal } = usePayment();

  function handleApply() {
    if (!value) return;

    const numericValue = Number(value);
    if (numericValue <= 0) return;

    const amount =
      type === "percentage" ? -(subtotal * numericValue) / 100 : -numericValue;

    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: crypto.randomUUID(),
        label:
          type === "percentage"
            ? `Descuento ${numericValue}%`
            : `Descuento $${numericValue}`,
        type: "discount",
        amount,
      },
    });

    setOpenDialog(false);
    setValue("");
  }

  return (
    <>
      {/* ================= MENU ================= */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="rounded-md py-6 shadow-none w-15"
            tooltip="Opciones"
          >
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="top" align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => setOpenDialog(true)}
            className="flex items-center gap-2"
          >
            <Percent className="h-4 w-4" />
            Agregar descuento
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              console.log("Agregar cupón");
            }}
            className="flex items-center gap-2"
          >
            <Ticket className="h-4 w-4" />
            Agregar cupón
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ================= DIALOG ================= */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-105 min-h-90">
          <DialogHeader>
            <DialogTitle>Agregar descuento</DialogTitle>
          </DialogHeader>

          {/* TYPE SELECTOR */}
          <div className="flex gap-2">
            <button
              onClick={() => setType("percentage")}
              className={cn(
                "flex-1 border rounded-lg py-10 text-sm flex items-center justify-center gap-2 transition",
                type === "percentage"
                  ? "border-indigo-400 text-indigo-400 bg-indigo-50"
                  : "hover:bg-muted"
              )}
            >
              <Percent className="h-4 w-4" />
              Porcentaje
            </button>

            <button
              onClick={() => setType("fixed")}
              className={cn(
                "flex-1 border rounded-lg p-3 text-sm flex items-center justify-center gap-2 transition",
                type === "fixed"
                  ? "border-indigo-400 text-indigo-400 bg-indigo-50"
                  : "hover:bg-muted"
              )}
            >
              <DollarSign className="h-4 w-4" />
              Monto fijo
            </button>
          </div>

          {/* INPUT */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {type === "percentage"
                ? "Porcentaje de descuento"
                : "Monto de descuento"}
            </label>

            <div className="relative">
              {type === "fixed" && (
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}

              {type === "percentage" && (
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}

              <Input
                type="number"
                min={0}
                max={type === "percentage" ? 100 : undefined}
                placeholder={type === "percentage" ? "Ej. 10" : "Ej. 50"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pl-9 shadow-none py-5"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setOpenDialog(false)}
              className="shadow-none py-5"
            >
              Cancelar
            </Button>

            <Button onClick={handleApply} disabled={!value} className="py-5">
              Aplicar descuento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
