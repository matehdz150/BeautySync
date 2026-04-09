import { AvailabilitySnapshotSettings } from './availability-snapshot.entity';

export type TimeSlot = {
  start: Date;
  end: Date;
  staffId: string;
};

export type DayAvailability = {
  date: string;
  hasAvailability: boolean;
  slots: TimeSlot[];
  staffIds: string[];
  startsByStaff: Map<string, number[]>;
};

export type AvailabilityIndex = {
  byDay: Map<string, DayAvailability>;
  availableDates: string[];
  staffIdsByService: Map<string, string[]>;
  serviceDurations: Map<string, number>;
  activeStaffIds: string[];
  settings: AvailabilitySnapshotSettings;
};
