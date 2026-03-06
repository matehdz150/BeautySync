"use client";

import { DateTime } from "luxon";
import { CheckCircle2, Receipt, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

type PaymentItem = {
  id: string;
  label: string;
  amountCents: number;
  meta?: {
    durationMin?: number;
  };
  staff?: {
    name?: string;
  };
};

type Client = {
  name?: string;
  email?: string;
  avatarUrl?: string;
};

type Payment = {
  id: string;
  status: string;
  paidAt?: string;
  paymentMethod?: string;

  client?: Client;

  items?: PaymentItem[];

  subtotalCents: number;
  discountsCents: number;
  taxCents: number;
  totalCents: number;
};

type Props = {
  payment: Payment;
};

export function PaidOrderPage({ payment }: Props) {
  function formatMoney(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-10">
      <div className="w-full max-w-[32rem] space-y-6">

        {/* ================= STATUS HEADER ================= */}

        <div className="bg-white border rounded-xl p-6 flex items-center gap-4">
          <CheckCircle2 className="h-10 w-10 text-indigo-500" />

          <div>
            <p className="text-lg font-semibold">Pago realizado</p>

            {payment.paidAt && (
              <p className="text-sm text-muted-foreground">
                {DateTime.fromISO(payment.paidAt)
                  .setLocale("es")
                  .toFormat("cccc d LLLL yyyy, HH:mm")}
              </p>
            )}
          </div>
        </div>

        {/* ================= CLIENT ================= */}

        <div className="bg-white border rounded-xl p-5 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Cliente
          </p>

          {payment.client ? (
            <div className="flex items-center gap-4">

              <Avatar className="h-10 w-10">

                {payment.client.avatarUrl && (
                  <AvatarImage src={payment.client.avatarUrl} />
                )}

                <AvatarFallback>
                  {payment.client.name
                    ? payment.client.name.charAt(0).toUpperCase()
                    : <User className="h-5 w-5" />}
                </AvatarFallback>

              </Avatar>

              <div className="leading-tight">
                <p className="font-medium">{payment.client.name}</p>

                {payment.client.email && (
                  <p className="text-sm text-muted-foreground">
                    {payment.client.email}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Venta realizada sin cliente asignado
            </p>
          )}
        </div>

        {/* ================= RECEIPT ================= */}

        <div className="bg-white border rounded-xl overflow-hidden">

          {/* HEADER */}

          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Orden de pago
              </p>

              <p className="text-xs text-muted-foreground">
                ID {payment.id}
              </p>
            </div>

            <span className="text-xs px-2 py-1 rounded-full bg-indigo-400 text-white capitalize">
              {payment.status}
            </span>
          </div>

          <Separator />

          {/* ITEMS */}

          <div className="px-5 py-4 space-y-4">
            {payment.items?.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-start gap-4"
              >
                <div>
                  <p className="font-medium">{item.label}</p>

                  {(item.meta?.durationMin || item.staff?.name) && (
                    <p className="text-xs text-muted-foreground">
                      {item.meta?.durationMin && `${item.meta.durationMin} min`}
                      {item.staff?.name && ` • ${item.staff.name}`}
                    </p>
                  )}
                </div>

                <p className="font-medium">
                  {formatMoney(item.amountCents)}
                </p>
              </div>
            ))}
          </div>

          <Separator />

          {/* TOTALS */}

          <div className="px-5 py-4 space-y-1 text-sm">

            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatMoney(payment.subtotalCents)}</span>
            </div>

            {payment.discountsCents > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Descuentos</span>
                <span>-{formatMoney(payment.discountsCents)}</span>
              </div>
            )}

            {payment.taxCents > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Impuestos</span>
                <span>{formatMoney(payment.taxCents)}</span>
              </div>
            )}

            <div className="flex justify-between font-semibold text-base pt-2">
              <span>Total</span>
              <span>{formatMoney(payment.totalCents)}</span>
            </div>

          </div>

          {/* FOOTER */}

          {payment.paymentMethod && (
            <div className="px-5 py-3 border-t text-xs text-muted-foreground">
              Pagado con{" "}
              <span className="capitalize">{payment.paymentMethod}</span>
            </div>
          )}

        </div>

        {/* ================= ACTIONS ================= */}

        <div className="flex gap-3">

          <Button variant="outline" className="flex-1">
            Imprimir recibo
          </Button>

          <Button variant="outline" className="flex-1">
            Ver historial
          </Button>

        </div>
      </div>
    </div>
  );
}