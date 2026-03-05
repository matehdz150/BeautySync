"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Wallet,
  Nfc,
  QrCode,
  Gift,
  CircleDollarSign,
} from "lucide-react";

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

type Props = {
  appointmentId?: string;
};

export default function CheckoutPage({ appointmentId }: Props) {
  const { state, removeItem, finalize, setPaymentMethod } = usePayment();

  const paymentMethod = state.paymentMethod;

  const canSubmit =
    state.items.length > 0 &&
    !!paymentMethod &&
    !!state.paymentId;

  return (
    <div className="min-h-screen bg-white">
      <div className="px-12 grid xl:grid-cols-[1fr_520px] gap-12 min-h-screen">
        {/* LEFT */}
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

          <header>
            <ClientSummary client={state.client} />
          </header>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Servicios</h2>

            <CartItems
              items={state.items}
              onAddClick={() => {
                console.log("abrir marketplace");
              }}
            />
          </div>
        </section>

        {/* RIGHT */}
        <aside className="space-y-8 sticky top-10 border-l px-10 py-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Método de pago</h3>

            <div className="grid grid-cols-3 gap-5">
              <button
                onClick={() => setPaymentMethod("card")}
                className={cn(
                  "h-24 rounded-xl border flex flex-col items-center justify-center gap-2",
                  paymentMethod === "card" &&
                    "border-indigo-400 text-indigo-400"
                )}
              >
                <CreditCard className="h-5 w-5" />
                Tarjeta
              </button>

              <button
                onClick={() => setPaymentMethod("cash")}
                className={cn(
                  "h-24 rounded-xl border flex flex-col items-center justify-center gap-2",
                  paymentMethod === "cash" &&
                    "border-indigo-400 text-indigo-400"
                )}
              >
                <Wallet className="h-5 w-5" />
                Efectivo
              </button>

              <button
                onClick={() => setPaymentMethod("gift_card")}
                className={cn(
                  "h-24 rounded-xl border flex flex-col items-center justify-center gap-2",
                  paymentMethod === "gift_card" &&
                    "border-indigo-400 text-indigo-400"
                )}
              >
                <Gift className="h-5 w-5" />
                Gift card
              </button>
            </div>

            <div className="grid grid-cols-3 gap-5 mt-5">
              <button
                onClick={() => setPaymentMethod("terminal")}
                className={cn(
                  "h-24 rounded-xl border flex flex-col items-center justify-center gap-2",
                  paymentMethod === "terminal" &&
                    "border-indigo-400 text-indigo-400"
                )}
              >
                <Nfc className="h-5 w-5" />
                Terminal
              </button>

              <button
                onClick={() => setPaymentMethod("qr")}
                className={cn(
                  "h-24 rounded-xl border flex flex-col items-center justify-center gap-2",
                  paymentMethod === "qr" &&
                    "border-indigo-400 text-indigo-400"
                )}
              >
                <QrCode className="h-5 w-5" />
                QR
              </button>

              <button
                onClick={() => setPaymentMethod("transfer")}
                className={cn(
                  "h-24 rounded-xl border flex flex-col items-center justify-center gap-2",
                  paymentMethod === "transfer" &&
                    "border-indigo-400 text-indigo-400"
                )}
              >
                <CircleDollarSign className="h-5 w-5" />
                Transferencia
              </button>
            </div>
          </div>

          <div className="border rounded-xl p-6 space-y-4 overflow-hidden">
            <PaymentBreakdown
              items={state.items}
              total={state.total}
              onRemoveItem={removeItem}
            />

            <div className="flex gap-2">
              <DiscountMenu />

              <Button
                className="py-6 text-lg flex-1"
                disabled={!canSubmit}
                onClick={finalize}
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
