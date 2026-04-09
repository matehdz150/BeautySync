export type NotificationSnapshotPayload = {
  booking: {
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
    totalCents: number;
  } | null;
  client: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
  staff: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
  services: Array<{
    id: string;
    name: string;
    durationMin: number;
    priceCents: number;
    color?: string | null;
  }>;
  branch: {
    id: string;
    name: string;
    coverImage?: string | null;
  } | null;
  meta?: Record<string, unknown>;
};

export type NotificationDetailSnapshot = {
  booking: {
    id: string;
    branchId: string;
    startsAt: string;
    endsAt: string;
    status: string;
    paymentMethod: string | null;
    totalCents: number;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    appointments: Array<{
      id: string;
      start: string;
      end: string;
      status: string;
      paymentStatus: string;
      priceCents: number | null;
      notes: string | null;
      service: {
        id: string;
        name: string;
        durationMin: number;
        priceCents: number | null;
      } | null;
      staff: {
        id: string;
        name: string | null;
        avatarUrl: string | null;
      } | null;
      client: {
        id: string;
        name: string | null;
        avatarUrl: string | null;
      } | null;
    }>;
  } | null;
  branch: {
    id: string;
    name: string;
    address: string | null;
    description: string | null;
    lat: string | null;
    lng: string | null;
    images: Array<{
      id: string;
      url: string;
      isCover: boolean;
      position: number;
    }>;
  } | null;
};
