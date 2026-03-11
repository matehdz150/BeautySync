export type ClientProfile = {
  gender?: string | null;
  occupation?: string | null;
  city?: string | null;
  ageRange?: string | null;
  preferredStaffId?: string | null;
  marketingOptIn?: boolean | null;
};

export class Client {
  constructor(
    public id: string,
    public organizationId: string,
    public name: string | null,
    public email: string | null,
    public phone: string | null,
    public avatarUrl: string | null,
    public birthdate: string | null,
    public createdAt: Date | null,
    public profile?: ClientProfile | null,
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

export type ClientEditData = {
  id: string;

  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;

  birthdate?: string | null;

  profile?: {
    gender?: string | null;
    occupation?: string | null;
    city?: string | null;
    ageRange?: string | null;
    preferredStaffId?: string | null;
    marketingOptIn?: boolean | null;
  };

  editable: {
    name: boolean;
    email: boolean;
    phone: boolean;
  };
};
