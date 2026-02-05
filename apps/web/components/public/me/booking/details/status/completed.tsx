// status/completed.tsx
import { CheckCheck, Star, Store } from "lucide-react";
import { BookingStatusConfig } from "./types";

export const completedStatus: BookingStatusConfig = {
  badge: {
    label: "Completado",
    className: "bg-lime-700 text-white",
    icon: <CheckCheck className="h-4 w-4" />,
  },

  actions: ({ booking }) => [
    {
      type: "link",
      icon: <Star />,
      title: "Agregar calificación",
      subtitle: "Cuéntanos tu experiencia",
      href: `${booking.bookingId}/rate`,
    },
    {
      type: "link",
      icon: <Store />,
      title: "Información del establecimiento",
      subtitle: booking.branch.address ?? booking.branch.name,
      href: `/explore/${booking.branch.slug}`,
    },
  ],
};