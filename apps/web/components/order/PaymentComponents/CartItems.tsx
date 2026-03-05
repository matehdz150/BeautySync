"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentItem } from "@/context/PaymentContext";
import { AddToCartDrawer } from "./AddToCartDrawer";
import { motion } from "framer-motion";

type CartItemsProps = {
  items: PaymentItem[];
  className?: string;
};

export function CartItems({ items, className }: CartItemsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      
      {/* EMPTY STATE */}
      {items.length === 0 && (
        <div className="border rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4">
          <div className="flex flex-col items-center justify-center text-center py-12 px-6">
            
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
              <ShoppingCart className="h-10 w-10 text-indigo-400" />
            </div>

            <h3 className="text-lg font-semibold">
              Tu carrito está vacío
            </h3>

            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Agrega un servicio o producto para comenzar el cobro.
            </p>
          </div>
        </div>
      )}

      {/* ITEMS */}
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between border rounded-md"
            >
              <div className="flex gap-3">
                
                <div
                  className="w-1 rounded-md"
                  style={{
                    backgroundColor: item.meta?.color ?? "#E5E7EB",
                  }}
                />

                <div className="flex flex-col gap-1 py-3">
                  <p className="font-medium">{item.label}</p>

                  {(item as any).duration && (
                    <p className="text-sm text-muted-foreground">
                      {(item as any).duration} min
                      {item.staff?.name && ` • ${item.staff.name}`}
                    </p>
                  )}
                </div>
              </div>

              <p className="font-medium p-3 whitespace-nowrap">
                ${item.amount} MXN
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ADD BUTTON — SIEMPRE VISIBLE */}
      <motion.div
        whileHover={{ backgroundPosition: "100% 0%" }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="rounded-xl"
        style={{
          background: `
            linear-gradient(
              90deg,
              #818CF8 0%,
              #6366F1 50%,
              #6366F1 100%
            )
          `,
          backgroundSize: "200% 100%",
        }}
      >
        <AddToCartDrawer>
          <Button
            className="
              w-full
              bg-transparent
              hover:bg-transparent
              text-white
              px-8
              py-6
              rounded-xl
              cursor-pointer
              shadow-none
            "
          >
            Agregar servicio o producto
          </Button>
        </AddToCartDrawer>
      </motion.div>
    </div>
  );
}