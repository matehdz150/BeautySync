// lib/ui/bookingStatus.ts
export function getBookingStatusUI(status: string) {
  switch (status) {
    case "PENDING":
      return {
        label: "Pendiente",
        className: "bg-yellow-50 text-yellow-700",
      };

    case "CONFIRMED":
      return {
        label: "Confirmado",
        className: "bg-indigo-50 text-indigo-700",
      };

    case "COMPLETED":
      return {
        label: "Completado",
        className: "bg-green-50 text-green-700",
      };

    case "CANCELLED":
      return {
        label: "Cancelado",
        className: "bg-red-50 text-red-700",
      };

    case "NO_SHOW":
      return {
        label: "No asistió",
        className: "bg-gray-100 text-gray-600",
      };

    default:
      return {
        label: status,
        className: "bg-muted text-muted-foreground",
      };
  }
}