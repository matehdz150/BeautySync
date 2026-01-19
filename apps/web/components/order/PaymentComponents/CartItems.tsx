"use client";

import { Button } from "@/components/ui/button";
import { Plus, Pointer, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentItem } from "@/context/PaymentContext";
import { AddToCartDrawer } from "./AddToCartDrawer";
import { motion } from "framer-motion";

type CartItemsProps = {
  items: PaymentItem[];
  categoryColor?: string;
  onAddClick?: () => void;
  className?: string;
};

export function CartItems({
  items,
  className,
}: CartItemsProps) {
  // 🟡 EMPTY STATE
  if (items.length === 0) {
    return (
      <div
        className={cn(
          "border rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4",
          className
        )}
      >
        <div className="flex flex-col items-center justify-center text-center py-20 px-6">
          {/* Icon */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
            <ShoppingCart className="h-10 w-10 text-indigo-400" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground">
            Tu carrito está vacío
          </h3>

          {/* Description */}
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Agrega un servicio o producto para continuar con el cobro. También
            puedes asignar un cliente para mejores recomendaciones.
          </p>

          {/* CTA */}
            <motion.div
      whileHover={{
        backgroundPosition: "100% 0%",
      }}
      transition={{
        duration: 0.5,
        ease: "easeInOut",
      }}
      className="mt-6 rounded-xl "
      style={{
        background: `
          linear-gradient(
            90deg,
            #818CF8 0%,   /* indigo-400 */
            #6366F1 50%,  /* indigo-500 */
            #6366F1 100%  /* indigo-500 */
          )
        `,
        backgroundSize: "200% 100%",
        backgroundPosition: "0% 0%",
      }}
    >
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
        variant={'primary'}
      >
        Agregar servicio o producto
      </Button>
    </motion.div>
        </div>

      </div>
    );
  }

  // ✅ ITEMS
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <div key={item.id} className="flex justify-between border rounded-md">
          <div className="flex gap-3">
            {/* COLOR BAR */}
            <div
              className="w-1 rounded-md"
              style={{
                backgroundColor: item.meta?.color ?? "#E5E7EB",
              }}
            />

            {/* INFO */}
            <div className="flex flex-col gap-1 py-3">
              <p className="font-medium">{item.label}</p>

              {/* Optional metadata */}
              {"date" in item && item.date && (
                <p className="text-sm text-muted-foreground">{item.date}</p>
              )}

              {(item as any).duration && (
                <p className="text-sm text-muted-foreground">
                  {(item as any).duration} min
                  {item.staff?.name && ` • ${item.staff.name}`}
                </p>
              )}
            </div>
          </div>

          {/* PRICE */}
          <p className="font-medium p-3 whitespace-nowrap">
            ${item.amount} MXN
          </p>
          
        </div>
      ))}
      <AddToCartDrawer/>
    </div>
  );
}
