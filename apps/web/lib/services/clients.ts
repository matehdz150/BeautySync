import { api } from "./api";

/* =============================
   CLIENT LIST
============================= */

export type Client = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt?: string;

  totalBookings: number;
  averageRating: number | null;
  ratingCount: number;
};

export async function getClients(orgId: string) {
  return api<Client[]>(`/clients/organization/${orgId}`);
}

/* =============================
   CLIENT PROFILE
============================= */

export type ClientProfile = {
  gender?: string | null;
  occupation?: string | null;
  city?: string | null;
  ageRange?: string | null;
  preferredStaffId?: string | null;
  marketingOptIn?: boolean | null;
};

/* =============================
   CREATE CLIENT
============================= */

export type CreateClientInput = {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  birthdate?: string;

  profile?: ClientProfile;
};

export async function createClient(input: CreateClientInput) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return api<Client>("/clients", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      organizationId: user.orgId,
    }),
  });
}

/* =============================
   UPDATE CLIENT
============================= */

export type UpdateClientInput = {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  birthdate?: string;

  profile?: ClientProfile;
};

export async function updateClient(
  id: string,
  input: UpdateClientInput
) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return api<Client>(`/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...input,
      organizationId: user.orgId,
    }),
  });
}

/* =============================
   CLIENT DETAIL TYPES
============================= */

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
  appointments: ClientAppointment[];
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

export type ClientReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;

  bookingId: string;
  branchId: string;
  branchName: string;

  staff?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  }[];
};

/* =============================
   CLIENT DETAIL
============================= */

export type ClientDetail = {
  client: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    createdAt?: string;
  };

  profile?: ClientProfile | null;

  stats: ClientStats;
  bookings: ClientBooking[];
  reviews: ClientReview[];
};

export async function getClientDetail(
  id: string
): Promise<ClientDetail> {
  return api<ClientDetail>(`/clients/${id}`);
}

/* =============================
   CLIENT EDIT DATA
============================= */

export type ClientEditable = {
  name: boolean
  email: boolean
  phone: boolean
}

export type ClientEditData = {
  id: string

  name?: string | null
  email?: string | null
  phone?: string | null
  avatarUrl?: string | null

  birthdate?: string | null

  profile?: {
    gender?: string | null
    occupation?: string | null
    city?: string | null
    ageRange?: string | null
    preferredStaffId?: string | null
    marketingOptIn?: boolean | null
  }
  editable?: ClientEditable
}

export async function getClientEdit(id: string) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return api<ClientEditData>(
    `/clients/edit/${id}?organizationId=${user.orgId}`
  );
}

export async function deleteClient(id: string) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return api(`/clients/${id}?organizationId=${user.orgId}`, {
    method: "DELETE",
  });
}

export type PublicClient = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;

  publicUserId: string; // 🔥 clave para gift cards
};

export async function getPublicClients(orgId: string) {
  return api<PublicClient[]>(
    `/clients/organization/${orgId}/public`
  );
}