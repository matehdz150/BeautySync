export const BLOCKING_APPOINTMENT_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
] as const;

export type BlockingAppointmentStatus =
  (typeof BLOCKING_APPOINTMENT_STATUSES)[number];
