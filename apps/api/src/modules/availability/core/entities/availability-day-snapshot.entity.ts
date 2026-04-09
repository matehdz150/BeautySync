export type AvailabilityDaySnapshotStaff = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type AvailabilityDaySnapshotService = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  availableStaffIdsByStart: Array<[number, string[]]>;
};

export type AvailabilityDaySnapshot = {
  branchId: string;
  date: string;
  timezone: string;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  generatedAt: string;
  stepMin: number;
  staff: AvailabilityDaySnapshotStaff[];
  services: AvailabilityDaySnapshotService[];
};
