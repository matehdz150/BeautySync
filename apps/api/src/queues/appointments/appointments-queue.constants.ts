export const APPOINTMENTS_QUEUE = 'appointments';

export const APPOINTMENTS_JOBS = {
  REMINDER_24H: 'appointments.reminder.24h',
  REMINDER_2H: 'appointments.reminder.2h',
  REMINDER_5M: 'appointments.reminder.5m',
  FINALIZE_AFTER: 'appointments.finalize.after',
} as const;

export type AppointmentJobName =
  (typeof APPOINTMENTS_JOBS)[keyof typeof APPOINTMENTS_JOBS];
