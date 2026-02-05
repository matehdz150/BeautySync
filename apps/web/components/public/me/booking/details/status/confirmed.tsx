// status/confirmed.tsx
import {
  CircleCheck,
  CalendarSync,
  XCircle,
  Store,
  ShoppingCart,
} from "lucide-react";
import { BookingStatusConfig } from "./types";

export const confirmedStatus: BookingStatusConfig = {
  badge: {
    label: "Confirmado",
    className: "bg-indigo-400 text-white",
    icon: <CircleCheck className="h-4 w-4" />,
  },

  actions: ({ booking, cancelling }) => [
    {
      type: "link",
      icon: <ShoppingCart />,
      title: "Volver a reservar",
      subtitle: "Reserva tu próxima cita",
      href: `/book/${booking.branch.slug}`,
    },
    {
      type: "link",
      icon: <Store />,
      title: "Información del establecimiento",
      subtitle: booking.branch.address ?? booking.branch.name,
      href: `/explore/${booking.branch.slug}`,
    },
    {
      type: "link",
      icon: <CalendarSync />,
      title: "Reagendar cita",
      subtitle: "Cambia el horario de tu cita",
      href: `${booking.bookingId}/reschedule`,
    },
    {
      type: "action",
      icon: <XCircle className="text-red-600" />,
      title: cancelling ? "Cancelando..." : "Cancelar cita",
      subtitle: "Esta acción no se puede deshacer",
      onClick: "cancel",
      danger: true,
      disabled: cancelling,
    },
  ],
};