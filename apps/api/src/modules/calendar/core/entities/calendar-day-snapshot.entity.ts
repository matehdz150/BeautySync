import {
  CalendarSnapshotAppointment,
  CalendarSnapshotTimeOff,
} from './calendar-snapshot.entity';

export type CalendarDaySnapshot = {
  branchId: string;
  date: string;
  timezone: string;
  generatedAt: string;
  appointments: CalendarSnapshotAppointment[];
  timeOffs: CalendarSnapshotTimeOff[];
  meta: {
    totalAppointments: number;
    totalTimeOffs: number;
  };
};
