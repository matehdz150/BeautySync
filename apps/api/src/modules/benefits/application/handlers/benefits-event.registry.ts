import { Injectable, OnModuleInit } from '@nestjs/common';
import { DomainEventBus } from 'src/shared/domain-events/domain-event-bus';
import { BookingCreatedHandler } from './booking-created.handler';
import { ReviewCreatedHandler } from './review-created.handler';
import { PaymentCompletedHandler } from './payment-completed.handler';

@Injectable()
export class BenefitsEventRegistry implements OnModuleInit {
  constructor(
    private readonly bus: DomainEventBus,
    private readonly bookingHandler: BookingCreatedHandler,
    private readonly reviewHandler: ReviewCreatedHandler,
    private readonly paymentHandler: PaymentCompletedHandler,
  ) {}

  onModuleInit() {
    this.bus.register('booking.created', (event) =>
      this.bookingHandler.handle(event as any),
    );
    this.bus.register('review.created', (event) =>
      this.reviewHandler.handle(event as any),
    );
    this.bus.register('payment.completed', (event) =>
      this.paymentHandler.handle(event as any),
    );
  }
}
