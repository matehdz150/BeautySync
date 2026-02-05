// BookingDetails.tsx
import {
  MapPin,
  CreditCard,
  StickyNote,
} from "lucide-react";
import { BookingDetailVM } from "./booking-types";

export function BookingDetails({ booking }: { booking: BookingDetailVM }) {
  return (
    <div className="mt-4 space-y-3">
      {booking.branch.address && (
        <InfoCard icon={<MapPin />} title="Dirección">
          {booking.branch.address}
        </InfoCard>
      )}

      <InfoCard icon={<CreditCard />} title="Pago">
        {booking.paymentMethod === "ONLINE" ? "En línea" : "En sitio"}
      </InfoCard>

      {booking.notes && (
        <InfoCard icon={<StickyNote />} title="Notas">
          {booking.notes}
        </InfoCard>
      )}
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <div className="flex items-center gap-2 text-xs text-black/50">
        {icon}
        {title}
      </div>
      <p className="mt-1 text-sm font-semibold">{children}</p>
    </div>
  );
}