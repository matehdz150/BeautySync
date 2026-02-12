import { Notification } from "@/lib/services/notifications";

export type ActionType =
  | "VIEW_BOOKING"
  | "EDIT_BOOKING"
  | "RESCHEDULE_BOOKING"
  | "CANCEL_BOOKING"
  | "MESSAGE_CLIENT"
  | "VIEW_REVIEW"
  | "GO_TO_CHAT";

export function resolveActions(
  notification: Notification,
  booking?: any,
): ActionType[] {
  const { kind } = notification;
  const status = booking?.status;

  switch (kind) {
    case "BOOKING_CREATED":
      if (status === "CONFIRMED") {
        return [
          "VIEW_BOOKING",
          "EDIT_BOOKING",
          "RESCHEDULE_BOOKING",
          "CANCEL_BOOKING",
          "MESSAGE_CLIENT",
        ];
      }

      if (status === "COMPLETED") {
        return ["VIEW_BOOKING"];
      }

      return ["VIEW_BOOKING"];

    case "BOOKING_CANCELLED":
      return ["VIEW_BOOKING"];

    case "BOOKING_RESCHEDULED":
      return [
        "VIEW_BOOKING",
        "EDIT_BOOKING",
        "RESCHEDULE_BOOKING",
        "CANCEL_BOOKING",
        "MESSAGE_CLIENT",
      ];

    case "CHAT_MESSAGE":
      return ["GO_TO_CHAT"];

    case "REVIEW_CREATED":
      return ["VIEW_REVIEW"];

    default:
      return [];
  }
}