export type BookingStatus =
  | "CONFIRMED"
  | "PENDING"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

type IconType = React.ComponentType<{
  className?: string;
  width?: number;
  height?: number;
}>;

export type BookingAction =
  | {
      type: "link";
      icon: IconType;
      title: string;
      subtitle: string;
      href: string;
      disabled?: boolean;
      className?: string;
    }
  | {
      type: "action";
      icon: IconType;
      title: string;
      subtitle: string;
      onClick: "cancel";
      disabled?: boolean;
      danger?: boolean;
      className?: string;
    }
  | {
      type: "dropdown";
      icon: IconType;
      title: string;
      subtitle: string;
      items: BookingAction[];
      disabled?: boolean;
      className?: string;
    };

export type BookingDetailVM = {
  bookingId: string;
  status: BookingStatus;

  startsAtISO: string;
  endsAtISO: string;

  hasRating: boolean;

  itemsCount: number;
  totalPriceCents: number;

  paymentMethod: "ONLINE" | "ONSITE";
  notes: string | null;

  conversationId?: string | null;

  branch: {
    imageUrl?: string | null;
    id: string;
    name: string;
    slug: string;
    address?: string;
  };

  // 🔥 NUEVO
  policies: {
    cancelationWindowMin: number;
    rescheduleWindowMin: number;
  };

  appointments: Array<{
    id: string;
    status: BookingStatus;
    startIso: string;
    endIso: string;
    durationMin: number;
    priceCents: number;
    serviceName: string;
    staffName: string;
    staffAvatarUrl: string | null;
  }>;
};