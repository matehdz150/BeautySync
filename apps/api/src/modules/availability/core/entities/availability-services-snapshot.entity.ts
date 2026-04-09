export type AvailabilityServicesSnapshotSlot = {
  start: string;
  end: string;
  staffIds: string[];
};

export type AvailabilityServicesSnapshotStaff = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type AvailabilityServicesSnapshotService = {
  serviceId: string;
  serviceName: string;
  durationMin: number;
  priceCents: number;
  category: {
    id: string | null;
    name: string | null;
    colorHex: string | null;
  } | null;
  availableStaffIds: string[];
  availableSlots: AvailabilityServicesSnapshotSlot[];
};

export type AvailabilityServicesSnapshot = {
  branchId: string;
  date: string;
  generatedAt: string;
  staleAt?: string;
  expiresAt?: string;
  staff: AvailabilityServicesSnapshotStaff[];
  services: AvailabilityServicesSnapshotService[];
};
