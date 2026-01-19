import { DateTime } from "luxon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function PaidReceiptPreview({ payment }: { payment: any }) {
  return (
    <div className="px-5 py-6 space-y-6 bg-gray-50">
      {/* ================= HEADER ================= */}
      <div>
        <p className="text-2xl font-semibold">Venta</p>
        <p className="text-sm text-muted-foreground">
          {DateTime.fromISO(payment.createdAt).toFormat("ccc d LLL yyyy")}
        </p>
      </div>

      {/* ================= CLIENT ================= */}
      <div className="flex items-center gap-4 p-4 border rounded-sm bg-white">
        <Avatar className="h-12 w-12 bg-muted">
          <AvatarFallback>
            <User className="h-5 w-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>

        {payment.client ? (
          <div className="leading-tight">
            <p className="font-medium">{payment.client.name}</p>

            {payment.client.phone && (
              <p className="text-sm text-muted-foreground">
                {payment.client.phone}
              </p>
            )}

            {payment.client.email && (
              <p className="text-xs text-muted-foreground">
                {payment.client.email}
              </p>
            )}
          </div>
        ) : (
          <div className="leading-tight">
            <p className="font-medium text-muted-foreground">
              Venta sin cliente
            </p>
            <p className="text-sm text-muted-foreground">
              Cliente no asignado (walk-in)
            </p>
          </div>
        )}
      </div>

      {/* ================= RECEIPT ================= */}
      <div className="border rounded-sm bg-white overflow-hidden px-3">
        {/* Title */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-1">
            <p className="font-semibold">Venta #</p>
            <p className="text-xs font-semibold">{payment.id}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {DateTime.fromISO(payment.createdAt).toFormat("ccc d LLL yyyy")}
          </p>
        </div>

        {/* ITEMS */}
        <div className="px-4 py-3 space-y-4">
          {payment.items.map((item: any) => (
            <div key={item.id} className="flex justify-between gap-4">
              <div>
                <p className="font-medium">{item.label}</p>

                {item.meta?.durationMin && (
                  <p className="text-xs text-muted-foreground">
                    {DateTime.fromISO(payment.createdAt).toFormat("t")} •{" "}
                    {item.meta.durationMin} min • {item.staff?.name}
                  </p>
                )}
              </div>

              <p className="font-medium">
                ${(item.amountCents / 100).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
        <Separator />

        {/* TOTALS */}
        <div className="px-4 py-3 text-sm space-y-1">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>${(payment.subtotalCents / 100).toFixed(2)}</span>
          </div>

          {payment.taxCents > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Impuestos</span>
              <span>${(payment.taxCents / 100).toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between font-semibold text-base pt-1">
            <span>Total</span>
            <span>${(payment.totalCents / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-4 py-3 border-t text-xs text-muted-foreground">
          Pagado con <span className="capitalize">{payment.paymentMethod}</span>{" "}
          • {DateTime.fromISO(payment.paidAt).toFormat("d LLL yyyy 'a las' t")}
        </div>
      </div>
    </div>
  );
}
