export class Client {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly name: string | null,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly avatarUrl: string | null,
    public readonly birthdate: string | null,
    public readonly createdAt: Date | null,
  ) {}
}

export interface ClientDetails {
  client: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    createdAt: string | null;
  };
  stats: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    ratingCount: number;
    averageRating: number | null;
  };
  bookings: Array<{
    id: string;
    status: string;
    startsAt: string;
    endsAt: string;
    paymentMethod: string;
    totalCents: number;
    createdAt: string;
    branchId: string;
    branchName: string;
    appointments: Array<{
      id: string;
      start: string;
      end: string;
      status: string;
      priceCents: number | null;
      staff: {
        id: string;
        name: string;
        avatarUrl: string | null;
        jobRole: string | null;
      };
      service: {
        id: string;
        name: string;
        durationMin: number;
        priceCents: number;
      };
      publicUser: {
        id: string;
        name: string | null;
        email: string | null;
        avatarUrl: string | null;
      } | null;
    }>;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    bookingId: string;
    branchId: string;
    branchName: string;
    staff: Array<{
      id: string;
      name: string;
      avatarUrl: string | null;
    }>;
  }>;
}

export interface OrganizationClientListItem extends Record<string, unknown> {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  totalBookings: number;
  averageRating: number | null;
  ratingCount: number;
}
