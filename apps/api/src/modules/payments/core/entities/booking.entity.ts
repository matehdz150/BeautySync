export type FullBooking = {
  id: string;
  branchId: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  paymentMethod: string;
  totalCents: number;
  notes?: string | null;

  appointments: {
    id: string;
    start: Date;
    end: Date;
    priceCents: number | null;

    service: {
      id: string;
      name: string;
      durationMin: number;
    };

    staff: {
      id: string;
      name: string;
      avatarUrl?: string | null;
    };
  }[];
};
