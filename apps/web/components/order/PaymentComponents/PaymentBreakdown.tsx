"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePayment } from "@/context/PaymentContext";

export function PaymentBreakdown({
  taxRate = 0.05,
  currency = "MXN",
}: {
  taxRate?: number;
  currency?: string;
}) {
  const { state, dispatch } = usePayment();

  const items = state.items;

  const subtotal = items
    .filter((i) => i.type !== "discount" && i.amount > 0)
    .reduce((s, i) => s + i.amount, 0);

  const discount = items
    .filter((i) => i.type === "discount")
    .reduce((s, i) => s + i.amount, 0);

  const tax = Math.max(0, (subtotal + discount) * taxRate);
  const total = subtotal + discount + tax;

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
              onClick={() =>
                dispatch({
                  type: "REMOVE_ITEM",
                  payload: { id: item.id },
                })
              }
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

      {/* TAX */}
      <Row label="Tax" value={tax} />

      <hr />

      {/* TOTAL */}
      <div className="flex justify-between font-semibold text-base">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span>${value.toFixed(2)}</span>
    </div>
  );
}