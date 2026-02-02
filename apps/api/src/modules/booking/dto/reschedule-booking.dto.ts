export class RescheduleBookingDto {
  bookingId: string;

  // viene del chain availability
  newStartIso: string;

  // opcional, para auditoría
  reason?: string;
}
