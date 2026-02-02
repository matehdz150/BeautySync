import { DateTime } from "luxon";
import { api } from "./api";

export async function createAppointment(input: {
  branchId: string;
  serviceId: string;
  staffId: string;
  clientId?: string;
  start: string;      // ISO string
  notes?: string;
}) {
  return api("/appointments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getAppointmentsByDay(params: {
  branchId: string;
  date: string; // YYYY-MM-DD LOCAL
  staffId?: string;
}) {
  return api<{
    total: number;
    data: Array<{
      id: string;
      start: string;
      end: string;
      service: { name: string, categoryColor?: string, categoryIcon?: string };
      client: { name: string };
      staff: { id: string; name: string };
    }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }>(`/appointments?${new URLSearchParams(params as any)}`);
}

export async function getAppointmentById(id: string) {
  if (!id) {
    throw new Error("appointment id is required");
  }

  return api<{
    id: string;
    start: string;
    end: string;
    status: string;
    priceCents: number;

    service: {
      id: string;
      name: string;
      durationMin: number;
      categoryColor?: string;
      categoryIcon?: string;
    };

    client?: {
      id: string;
      name: string;
      email?: string;
    } | null;

    staff: {
      id: string;
      name: string;
    };
  }>(`/appointments/${id}`);
}

export type ManagerPaymentMethod = "ONSITE" | "ONLINE";

export type CreateManagerAppointmentDraft = {
  serviceId: string;
  staffId: string; // UUID (NO "ANY" aquí)
  startIso: string; // ISO con offset o UTC ISO (como ya lo manejas)
  endIso: string;
  durationMin?: number;
};

export type CreateManagerBookingDto = {
  branchId: string;

  // opcionales
  clientId?: string | null;

  // si quieres linkearlo manualmente, pero normalmente esto lo deduces
  publicUserId?: string | null;

  date: string; // YYYY-MM-DD
  paymentMethod: ManagerPaymentMethod;

  discountCode?: string | null;
  notes?: string | null;

  appointments: CreateManagerAppointmentDraft[];
};

export type CreateManagerBookingResponse = {
  ok: true;
  publicBookingId: string | null;
  publicUserId: string | null;
  clientId: string | null;
  appointmentIds: string[];
};

export async function createManagerBooking(
  payload: CreateManagerBookingDto
): Promise<CreateManagerBookingResponse> {
  return api(`/manager/booking/appointments`, {
    method: "POST",
    body: JSON.stringify(payload), // ✅ ACOPLADO a tu api()
  });
}

export type StaffChoice = string | "ANY";

export type ChainItem = {
  serviceId: string;
  staffId: StaffChoice;
};

export type ManagerChainBaseDto = {
  branchId: string;
  date: string; // YYYY-MM-DD
  pinnedStartIso: string; // ISO (local o utc)
  chain: ChainItem[];
};

export type ManagerChainNextServicesDto = ManagerChainBaseDto;

export type ManagerChainNextStaffOptionsDto = ManagerChainBaseDto & {
  nextServiceId: string;
};

export type ManagerChainBuildDto = ManagerChainBaseDto;

export type ManagerChainNextServicesResponse = {
  ok: true;
  nextServices: {
    id: string;
    name: string;
    durationMin: number;
    priceCents: number;
    categoryColor: string | null;
  }[];
};

export type ManagerChainNextStaffOptionsResponse = {
  ok: true;
  allowAny: boolean;
  staff: { id: string; name: string; avatarUrl?: string | null }[];
};

export type ManagerChainBuildResponse = {
  ok: true;
  plan: {
    startIso: string;
    assignments: {
      serviceId: string;
      staffId: string;
      startIso: string;
      endIso: string;
      durationMin: number;
      priceCents: number;
    }[];
    totalMinutes: number;
    totalCents: number;
  };
};

// ===============================
// API calls
// ===============================

export async function managerChainNextServices(
  payload: ManagerChainNextServicesDto
): Promise<ManagerChainNextServicesResponse> {
  return api(`/manager/booking/chain/next-services`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function managerChainNextStaffOptions(
  payload: ManagerChainNextStaffOptionsDto
): Promise<ManagerChainNextStaffOptionsResponse> {
  return api(`/manager/booking/chain/next-staff-options`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function managerChainBuild(
  payload: ManagerChainBuildDto
): Promise<ManagerChainBuildResponse> {
  return api(`/manager/booking/chain/build`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type ManagerBookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "NO_SHOW"
  | "COMPLETED";

export type ManagerBooking = {
  id: string;
  date: string;

  startsAtISO: string;
  endsAtISO: string;

  status: ManagerBookingStatus;

  branch: {
    id: string;
    name: string;
  };

  client: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
  } | null;

  paymentStatus: "PAID" | "UNPAID";

  totalCents: number;

  appointments: {
    id: string;
    status: string;
    paymentStatus: "PAID" | "UNPAID";

    startIso: string;
    endIso: string;
    durationMin: number;

    priceCents: number;

    service: {
      id: string;
      name: string;
      categoryColor: string;
    };

    staff: {
      id: string;
      name: string;
      avatarUrl?: string | null;
    };
  }[];
};

export async function getManagerBookingById(bookingId: string) {
  if (!bookingId) throw new Error("bookingId is required");

  return api<{
    ok: true;
    booking: ManagerBooking;
  }>(`/manager/booking/${bookingId}`);
}

export type AssignBookingClientResponse = {
  ok: true;
  bookingId: string;
  clientId: string;
  publicUserId: string | null;
};

export async function assignClientToBooking(params: {
  bookingId: string;
  clientId: string;
}): Promise<AssignBookingClientResponse> {
  const { bookingId, clientId } = params;

  if (!bookingId) {
    throw new Error("bookingId is required");
  }

  if (!clientId) {
    throw new Error("clientId is required");
  }

  return api<AssignBookingClientResponse>(
    `/manager/booking/${bookingId}/assign-client`,
    {
      method: "POST",
      body: JSON.stringify({ clientId }),
    }
  );
}

export async function cancelPublicBooking(bookingId: string) {
  if (!bookingId) {
    throw new Error('bookingId is required');
  }

  return api<{
    ok: true;
    bookingId: string;
  }>(`/public/booking/${bookingId}/cancel`, {
    method: 'POST',
  });
}

export async function cancelManagerBooking(params: {
  bookingId: string;
  reason?: string;
}) {
  const { bookingId, reason } = params;

  if (!bookingId) {
    throw new Error('bookingId is required');
  }

  return api<{
    ok: true;
    bookingId: string;
  }>(`/manager/booking/${bookingId}/cancel`, {
    method: 'POST',
    body: JSON.stringify(reason ? { reason } : {}),
  });
}

export type BookingRescheduleReason =
  | "CLIENT_REQUEST"
  | "STAFF_REQUEST"
  | "SYSTEM"
  | "ADMIN";

export async function rescheduleManagerBooking(params: {
  bookingId: string;
  newStartIso: string; // ✅ ya viene UTC
  reason?: BookingRescheduleReason;
  notes?: string;
}) {
  const { bookingId, newStartIso, reason, notes } = params;

  if (!bookingId) throw new Error("bookingId is required");
  if (!newStartIso) throw new Error("newStartIso is required");

  return api<{ ok: true; bookingId: string; startsAt: string; endsAt: string }>(
    `/manager/booking/${bookingId}/reschedule`,
    {
      method: "POST",
      body: JSON.stringify({ newStartIso, reason, notes }),
    }
  );
}