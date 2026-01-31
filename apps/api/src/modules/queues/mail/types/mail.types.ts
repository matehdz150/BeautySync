export type BookingMailName =
  | 'mail.booking.confirmation'
  | 'mail.booking.reminder24h'
  | 'mail.booking.reminder2h'
  | 'mail.booking.reminder30m'
  | 'mail.booking.followup5m'
  | 'mail.booking.cancelled';

export type BookingMailPayload = {
  to: string;

  userName?: string | null;

  branchName?: string | null;
  branchAddress?: string | null;
  branchImageUrl?: string | null;

  dateLabel?: string | null;
  timeLabel?: string | null;

  bookingId: string;
  totalLabel?: string | null;

  manageUrl: string;

  directionsUrl?: string | null;
  establishmentUrl?: string | null;

  serviceLine?: string;
  staffLine?: string;

  cancelledBy?: 'PUBLIC' | 'MANAGER';
  cancelReason?: string | null;

  // ✅ opcional si quieres deep link para rebook
  rebookUrl?: string | null;
};
