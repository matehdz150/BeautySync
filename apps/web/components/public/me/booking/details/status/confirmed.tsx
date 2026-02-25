import {
  CalendarSync,
  CircleCheck,
  MessageCircle,
  Settings,
  ShoppingCart,
  Store,
  XCircle,
} from "lucide-react";
import { BookingStatusConfig } from "./types";

export const confirmedStatus: BookingStatusConfig = {
  badge: {
    label: "Confirmado",
    className: "bg-indigo-400 text-white",
    icon: <CircleCheck className="h-4 w-4" />,
  },

  actions: ({ booking, cancelling }) => {
    if (!booking?.policies) {
      console.log("BOOKING IN STATUS", booking);
      return [];
    }

    const minutesUntilStart =
      (new Date(booking.startsAtISO).getTime() - Date.now()) / 60000;

    const cancelLimit = booking.policies.cancelationWindowMin ?? 0;
    const rescheduleLimit = booking.policies.rescheduleWindowMin ?? 0;

    const canCancel = minutesUntilStart >= cancelLimit;
    const canReschedule = minutesUntilStart >= rescheduleLimit;

    const cancelHours = Math.floor(cancelLimit / 60);
    const rescheduleHours = Math.floor(rescheduleLimit / 60);

    return [
      {
        type: "link",
        icon: ShoppingCart,
        title: "Volver a reservar",
        subtitle: "Reserva tu próxima cita",
        href: `/book/${booking.branch.slug}`,
      },
      {
        type: "link",
        icon: Store,
        title: "Información del establecimiento",
        subtitle: booking.branch.address ?? booking.branch.name,
        href: `/explore/${booking.branch.slug}`,
      },
      {
        type: "dropdown",
        icon: Settings,
        title: "Gestionar cita",
        subtitle: "Reagendar, cancelar o enviar mensaje",
        items: [
          {
            type: "link",
            icon: CalendarSync,
            title: "Reagendar cita",
            subtitle: canReschedule
              ? `Disponible hasta ${rescheduleHours}h antes`
              : "Ya no es posible reagendar esta cita",
            href: `${booking.bookingId}/reschedule`,
            disabled: !canReschedule,
          },
          {
            type: "link",
            icon: MessageCircle,
            title: "Enviar mensaje a la sucursal",
            subtitle: "Tienes dudas? contacta al negocio",
            href: `/me/bookings/${booking.bookingId}/messages`,
          },
          {
            type: "action",
            icon: XCircle,
            title: cancelling ? "Cancelando..." : "Cancelar cita",
            subtitle: canCancel
              ? `Disponible hasta ${cancelHours}h antes`
              : "Ya no es posible cancelar esta cita",
            onClick: "cancel",
            danger: true,
            disabled: cancelling || !canCancel,
          },
        ],
      },
    ];
  },
};
