export type BookingCreatedEvent = {
  type: 'booking.created';

  payload: {
    bookingId: string;
    userId: string;
    branchId: string;
    amountCents: number;
    isOnline: boolean;
  };
};

export type ReviewCreatedEvent = {
  type: 'review.created';
  payload: {
    reviewId: string;
    userId: string;
    branchId: string;
  };
};

export type PaymentCompletedEvent = {
  type: 'payment.completed';

  payload: {
    paymentId: string;
    bookingId: string;
    userId: string;
    branchId: string;
    amountCents: number;
    method: 'ONLINE' | 'ONSITE';
  };
};
