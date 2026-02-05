// status/cancelled.tsx
import { XCircle } from "lucide-react";
import { BookingStatusConfig } from "./types";

export const cancelledStatus: BookingStatusConfig = {
  badge: {
    label: "Cancelado",
    className: "bg-red-600 text-white",
    icon: <XCircle className="h-4 w-4" />,
  },

  actions: () => [],
};