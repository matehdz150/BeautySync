// BookingSummary.tsx
import { BookingDetailVM } from "./booking-types";

function moneyMXN(cents: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function BookingSummary({ booking }: { booking: BookingDetailVM }) {
  return (
    <div className="mt-6 rounded-2xl border border-black/10 bg-white">
      <div className="p-4 sm:p-6">
        <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">
          Resumen
        </h3>

        <div className="mt-5 space-y-5">
          {booking.appointments.map((a) => (
            <div key={a.id} className="flex justify-between gap-4">
              <div>
                <p className="font-medium">{a.serviceName}</p>
                <p className="text-sm text-black/50">
                  {a.durationMin} min • {a.staffName}
                </p>
              </div>
              <p className="font-medium">
                {moneyMXN(a.priceCents)}
              </p>
            </div>
          ))}
        </div>

        <div className="my-6 h-px bg-black/10" />

        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{moneyMXN(booking.totalPriceCents)}</span>
        </div>
      </div>
    </div>
  );
}