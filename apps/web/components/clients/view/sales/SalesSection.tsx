"use client";

import { useEffect, useState } from "react";
import {
  getClientPayments,
  ClientPaymentDetails,
} from "@/lib/services/payments";

interface Props {
  clientId: string;
}

export default function SalesSection({ clientId }: Props) {
  const [payments, setPayments] = useState<ClientPaymentDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getClientPayments(clientId);
        setPayments(data);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [clientId]);

  if (loading) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-4">Ventas</h2>
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </section>
    );
  }

  const total = payments.reduce(
    (acc, p) => acc + p.payment.totalCents,
    0
  );

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">Ventas</h2>

      {/* TOTAL */}
      <div className="text-3xl font-bold">
        ${(total / 100).toLocaleString()}
      </div>

      {/* LISTA DE PAGOS */}
      <div className="space-y-4">
        {payments.map((p) => {
          const payment = p.payment;
          const booking = p.booking;
          const items = p.items;

          const date =
            booking?.startsAt ?? payment.createdAt;

          return (
            <div
              key={payment.id}
              className="border rounded-xl p-4 bg-white flex flex-col gap-3"
            >
              {/* HEADER */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {booking
                      ? "Reserva"
                      : "Venta POS"}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {new Date(date).toLocaleString()}
                  </p>
                </div>

                <p className="font-semibold">
                  ${(payment.totalCents / 100).toLocaleString()}
                </p>
              </div>

              {/* SERVICIOS */}
              {booking ? (
                <div className="space-y-1">
                  {booking.appointments.map((a) => (
                    <div key={a.id}>
                      <p className="font-medium">
                        {a.service.name}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {a.staff?.name ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {items.map((i) => (
                    <div key={i.id}>
                      <p className="font-medium">
                        {i.label}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        ${(i.amountCents / 100).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* STATUS */}
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-gray-100">
                  {payment.status}
                </span>

                {payment.paymentMethod && (
                  <span className="px-2 py-1 rounded bg-gray-100">
                    {payment.paymentMethod}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}