"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePayment } from "@/context/PaymentContext";

export function PaymentBreakdown({
  currency = "MXN",
}: {
  currency?: string;
}) {
  const { state, removeItem } = usePayment();

  const items = state.items;

  const subtotal = state.subtotal;
  const discounts = state.discounts;
  const total = state.total;

  return (
    <div className="space-y-3 text-sm">
      {/* ITEMS */}
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm",
                item.type === "discount"
                  ? "text-indigo-500"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </span>

            <button
              onClick={() => removeItem(item.id)}
              className="text-muted-foreground hover:text-black"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <span
            className={cn(
              "tabular-nums",
              item.amount < 0 && "text-indigo-500"
            )}
          >
            {item.amount < 0 ? "-" : ""}
            ${Math.abs(item.amount).toFixed(2)}
          </span>
        </div>
      ))}

      <hr />

      {/* SUBTOTAL */}
      <Row label="Subtotal" value={subtotal} />

      {/* DISCOUNTS */}
      {discounts > 0 && (
        <Row label="Descuentos" value={-discounts} highlight />
      )}

      <hr />

      {/* TOTAL */}
      <div className="flex justify-between font-semibold text-base">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between text-muted-foreground",
        highlight && "text-indigo-500"
      )}
    >
      <span>{label}</span>
      <span>${value.toFixed(2)}</span>
    </div>
  );
}