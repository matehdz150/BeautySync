import type { AppointmentStatus } from 'src/modules/db/schema/appointments/appointments';

export type PublicAppointmentListItem = {
  id: string;
  status: AppointmentStatus;

  branchName: string;
  startsAtISO: string;
  endsAtISO: string;

  priceCents: number | null;

  // hoy tu modelo es 1 appointment = 1 service
  itemsCount: number;

  coverUrl: string | null;

  // útil si quieres navegar por booking (chain)
  publicBookingId: string | null;
};

export type PublicAppointmentsListResponse = {
  items: PublicAppointmentListItem[];
  nextCursor: string | null;
};

export type PublicAppointmentDetailResponse = {
  id: string;
  status: AppointmentStatus;

  startsAtISO: string;
  endsAtISO: string;

  priceCents: number | null;
  notes: string | null;

  branch: {
    id: string;
    name: string;
    coverUrl: string | null;
  };

  service: {
    id: string;
    name: string;
    durationMin: number | null;
  };

  staff: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };

  publicBookingId: string | null;
};

export type PublicBookingListItem = {
  bookingId: string;

  status: AppointmentStatus; // o bookingStatus si lo calculas
  startsAtISO: string;
  endsAtISO: string;

  branch: {
    id: string;
    name: string;
    slug: string;
    coverUrl: string | null;
  };

  totalPriceCents: number | null;
  itemsCount: number;

  servicesPreview: { id: string; name: string }[]; // (opcional pero nice)
  staffPreview: { id: string; name: string; avatarUrl: string | null }[]; // opcional
};
