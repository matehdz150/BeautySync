import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "../ui/StatusBadge";

interface Props {
  booking: any;
}

export default function BookingCard({ booking }: Props) {
  return (
    <div className="relative">
      <div className="absolute left-[-3.5rem] top-6 w-10 h-10 bg-black rounded-full flex items-center justify-center shadow-sm">
        <Calendar size={16} className="text-white" />
      </div>

      <div className="border rounded-xl p-6 bg-white space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">Cita</p>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-xs text-muted-foreground">
                {new Date(booking.startsAt).toLocaleString()}
              </p>

              <StatusBadge status={booking.status} />
            </div>
          </div>

          <p className="font-semibold text-base">
            ${(booking.totalCents / 100).toLocaleString()}
          </p>
        </div>

        {booking.appointments.map((appointment: any) => (
          <div key={appointment.id} className="space-y-1">
            <p className="font-semibold">{appointment.service.name}</p>

            <p className="text-sm text-muted-foreground">
              {new Date(appointment.start).toLocaleTimeString()} ·{" "}
              {appointment.staff?.name ?? "—"}
            </p>
          </div>
        ))}

        <div className="flex gap-3 pt-2">
          <Button
            variant="default"
            className="px-4 py-1.5 text-sm rounded-full"
          >
            Ver detalles
          </Button>
        </div>
      </div>
    </div>
  );
}