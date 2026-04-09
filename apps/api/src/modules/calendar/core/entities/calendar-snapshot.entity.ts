type CalendarSnapshotAppointment = {
  type: 'APPOINTMENT';
  id: string;
  staffId: string;
  bookingId?: string | null;
  start: string;
  end: string;
  clientName: string;
  serviceName: string;
  color?: string;
};

type CalendarSnapshotTimeOff = {
  type: 'TIME_OFF';
  id: number;
  staffId: string;
  start: string;
  end: string;
  reason?: string;
};

export type CalendarSnapshotEvent =
  | CalendarSnapshotAppointment
  | CalendarSnapshotTimeOff;

export type CalendarSnapshot = {
  branchId: string;
  month: string;
  timezone: string;
  generatedAt: string;
  eventsByDay: Record<string, CalendarSnapshotEvent[]>;
  weekSummary: Record<string, number>;
};
