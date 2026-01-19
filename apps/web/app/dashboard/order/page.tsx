"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Wallet,
  User,
  EllipsisVertical,
  Nfc,
  QrCode,
  Gift,
  CircleDollarSign,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { PaymentBreakdown } from "@/components/order/PaymentComponents/PaymentBreakdown";
import { usePayment } from "@/context/PaymentContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ClientSummary } from "@/components/order/PaymentComponents/ClientSummary";
import { CartItems } from "@/components/order/PaymentComponents/CartItems";
import { DiscountMenu } from "@/components/order/PaymentComponents/DiscountMenu";
import { useBranch } from "@/context/BranchContext";

type Props = {
  appointmentId?: string;
};

export default function CheckoutPage({ appointmentId }: Props) {
  const { dispatch, total, state, submitPayment, canSubmit, pricing } = usePayment();
  const { branch } = useBranch();

  useEffect(() => {
    dispatch({ type: "RESET_PAYMENT" });
  }, [dispatch]);

  const payment = state.paymentMethod;

  return (
    <div className="min-h-screen bg-white">
      {/* CONTENT */}
      <div className="px-12  grid xl:grid-cols-[1fr_520px] gap-12 min-h-screen">
        {/* LEFT — ITEMS */}
        <section className="space-y-6 py-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/calendar">
                  Calendario
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbPage>Orden de pago</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {/* HEADER */}
          <header>
            <div className="flex gap-6 w-full ">
              {/* LEFT */}
              <ClientSummary
                client={state.client}
                onAddClient={() => {
                  // abrir modal / drawer de clientes
                  console.log("Agregar cliente");
                }}
                onActionsClick={() => {
                  // abrir menú: cambiar / editar / quitar
                  console.log("Acciones cliente");
                }}
              />
            </div>
          </header>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Servicios</h2>
            <CartItems
              items={state.items}
              onAddClick={() => {
                // abrir drawer marketplace
              }}
            />
          </div>
        </section>

        {/* RIGHT — PAYMENT */}
        <aside className="space-y-8 sticky top-10 border-l px-10 py-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Método de pago</h3>

            <div className="grid grid-cols-3 gap-5">
              <button
                onClick={() =>
                  dispatch({
                    type: "SET_PAYMENT_METHOD",
                    payload: "card",
                  })
                }
                className={cn(
                  "h-24 w-full rounded-xl border flex flex-col items-center justify-center gap-2 transition",
                  payment === "card" && "border-indigo-400 text-indigo-400"
                )}
              >
                <CreditCard className="h-5 w-5" />
                <span className="text-sm font-medium">Tarjeta</span>
              </button>

              <button
                onClick={() =>
                  dispatch({
                    type: "SET_PAYMENT_METHOD",
                    payload: "cash",
                  })
                }
                className={cn(
                  "h-24 w-full rounded-xl border flex flex-col items-center justify-center gap-2 transition",
                  payment === "cash" && "border-indigo-400 text-indigo-400"
                )}
              >
                <Wallet className="h-5 w-5" />
                <span className="text-sm font-medium">Efectivo</span>
              </button>

              <button
                onClick={() =>
                  dispatch({
                    type: "SET_PAYMENT_METHOD",
                    payload: "gift_card",
                  })
                }
                className={cn(
                  "h-24 w-full rounded-xl border flex flex-col items-center justify-center gap-2 transition",
                  payment === "gift_card" && "border-indigo-400 text-indigo-400"
                )}
              >
                <Gift className="h-5 w-5" />
                <span className="text-sm font-medium">Gift card</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-5 mt-5">
              <button
                onClick={() =>
                  dispatch({
                    type: "SET_PAYMENT_METHOD",
                    payload: "terminal",
                  })
                }
                className={cn(
                  "h-24 w-full rounded-xl border flex flex-col items-center justify-center gap-2 transition",
                  payment === "terminal" && "border-indigo-400 text-indigo-400"
                )}
              >
                <Nfc className="h-5 w-5" />
                <span className="text-sm font-medium">Terminal</span>
              </button>

              <button
                onClick={() =>
                  dispatch({
                    type: "SET_PAYMENT_METHOD",
                    payload: "qr",
                  })
                }
                className={cn(
                  "h-24 w-full rounded-xl border flex flex-col items-center justify-center gap-2 transition",
                  payment === "qr" && "border-indigo-400 text-indigo-400"
                )}
              >
                <QrCode className="h-5 w-5" />
                <span className="text-sm font-medium">QR</span>
              </button>

              <button
                onClick={() =>
                  dispatch({
                    type: "SET_PAYMENT_METHOD",
                    payload: "transfer",
                  })
                }
                className={cn(
                  "h-24 w-full rounded-xl border flex flex-col items-center justify-center gap-2 transition",
                  payment === "transfer" && "border-indigo-400 text-indigo-400"
                )}
              >
                <CircleDollarSign className="h-5 w-5" />
                <span className="text-sm font-medium text-center">
                  Transferencia
                </span>
              </button>
            </div>
          </div>

          <div className="border rounded-xl p-6 space-y-4 overflow-hidden">
            <PaymentBreakdown
              items={pricing}
              total={total}
              onRemoveItem={(id) =>
                dispatch({
                  type: "REMOVE_ITEM",
                  payload: { id },
                })
              }
            />
            <div className="flex gap-2">
              <DiscountMenu />
              <Button
                className=" py-6 text-lg flex-1"
                disabled={!canSubmit}
                onClick={async () => {
                  await submitPayment({
                    organizationId: branch.organizationId,
                    branchId: branch.id,
                    appointmentId,
                  });
                }}
              >
                Pagar
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
