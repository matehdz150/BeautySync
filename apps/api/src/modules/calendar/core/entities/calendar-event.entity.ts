// core/entities/calendar-event.entity.ts

export type CalendarEvent = AppointmentEvent | TimeOffEvent;

export type AppointmentEvent = {
  type: 'APPOINTMENT';

  id: string;
  staffId: string;

  start: Date;
  end: Date;

  clientName: string;
  serviceName: string;
  color?: string;
};

export type TimeOffEvent = {
  type: 'TIME_OFF';

  id: number;
  staffId: string;

  start: Date;
  end: Date;

  reason?: string;
};
