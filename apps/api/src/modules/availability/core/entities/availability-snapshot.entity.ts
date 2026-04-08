export type AvailabilitySnapshotStaff = {
  id: string;
  branchId: string;
  userId: string | null;
  isActive: boolean;
};

export type AvailabilitySnapshotSchedule = {
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type AvailabilitySnapshotTimeOff = {
  staffId: string;
  start: Date;
  end: Date;
};

export type AvailabilitySnapshotAppointment = {
  staffId: string;
  start: Date;
  end: Date;
  status?: string;
};

export type AvailabilitySnapshotStaffService = {
  staffId: string;
  serviceId: string;
};

export type AvailabilitySnapshotService = {
  id: string;
  durationMin: number;
};

export type AvailabilitySnapshotSettings = {
  timezone: string;
  minBookingNoticeMin: number;
  maxBookingAheadDays: number;
  bufferBeforeMin: number;
  bufferAfterMin: number;
};

export type AvailabilitySnapshot = {
  branchId: string;
  rangeStartUtc: Date;
  rangeEndUtc: Date;
  settings: AvailabilitySnapshotSettings;
  staff: AvailabilitySnapshotStaff[];
  schedules: AvailabilitySnapshotSchedule[];
  timeOffs: AvailabilitySnapshotTimeOff[];
  appointments: AvailabilitySnapshotAppointment[];
  services: AvailabilitySnapshotService[];
  staffServices: AvailabilitySnapshotStaffService[];
};
