// status/confirmed.tsx
import {
  CircleCheck,
  CalendarSync,
  XCircle,
  Store,
  ShoppingCart,
  MessageCircle,
  Settings,
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
      icon: ShoppingCart,
      title: "Volver a reservar",
      subtitle: "Reserva tu próxima cita",
      href: `/book/${booking.branch.slug}`,
    },
    {
      type: "link",
      icon: Store ,
      title: "Información del establecimiento",
      subtitle: booking.branch.address ?? booking.branch.name,
      href: `/explore/${booking.branch.slug}`,
    },

    // 🔽 NUEVO BOTÓN UNIFICADO
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
          subtitle: "Cambio de planes? puedes reagendar",
          href: `${booking.bookingId}/reschedule`,
        },
        {
          type: "link",
          icon: MessageCircle ,
          title: "Enviar mensaje a la sucursal",
          subtitle: "Tienes dudas? contacta al negocio",
          href: `/dashboard/inbox/messages/${booking.conversationId}`,
        },
        {
          type: "action",
          icon: XCircle,
          title: cancelling ? "Cancelando..." : "Cancelar cita",
          subtitle: "Tuviste problemas? cancela tu cita",
          onClick: "cancel",
          danger: true,
          disabled: cancelling,
        },
      ],
    },
  ],
};