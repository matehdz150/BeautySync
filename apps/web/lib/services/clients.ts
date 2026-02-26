// apps/web/lib/services/clients.ts
import { api } from "./api";

export type Client = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt?: string;

  // 🔥 Nuevos campos analytics
  totalBookings: number;
  averageRating: number | null;
  ratingCount: number;
};


export async function getClients(orgId: string) {
  return api<Client[]>(`/clients/organization/${orgId}`);
}

export async function createClient(input: { name: string; email?: string }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return api("/clients", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      organizationId: user.orgId,   // 👈 MÁNDALO
    }),
  });
}

// =============================
// 📊 Client Detail Types
// =============================

export type ClientStats = {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  ratingCount: number;
  averageRating: number | null;
};

export type ClientBooking = {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string;
  paymentMethod: string;
  totalCents: number;
  createdAt: string;
  branchId: string;
  branchName: string;
  appointments: ClientAppointment[]
};

export type ClientAppointment = {
  id: string;
  start: string;
  end: string;
  status: string;
  priceCents: number | null;

  staff: {
    id: string;
    name: string;
    avatarUrl: string | null;
    jobRole?: string | null;
  };

  service: {
    id: string;
    name: string;
    durationMin: number;
    priceCents: number;
  };

  publicUser?: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  } | null;
};

export type ClientDetail = {
  client: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    createdAt?: string;
  };

  stats: ClientStats;

  bookings: ClientBooking[];
};

export async function getClientDetail(
  id: string,
): Promise<ClientDetail> {
  return api<ClientDetail>(`/clients/${id}`);
}