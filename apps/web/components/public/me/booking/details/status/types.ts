// status/types.ts
import { BookingAction, BookingDetailVM } from "../booking-types";

export type BookingStatusConfig = {
  badge: {
    label: string;
    className: string;
    icon: React.ReactNode;
  };

  actions: (ctx: {
    booking: BookingDetailVM;
    cancelling: boolean;
  }) => BookingAction[];

  cards?: (ctx: { booking: BookingDetailVM }) => React.ReactNode[];
};