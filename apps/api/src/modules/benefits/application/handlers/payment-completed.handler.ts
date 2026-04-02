import { Injectable } from '@nestjs/common';
import { ProcessPaymentBenefitsUseCase } from '../../core/use-cases/process-payment-benefits.use-case';
import { PaymentCompletedEvent } from 'src/shared/domain-events/events';

@Injectable()
export class PaymentCompletedHandler {
  constructor(
    private readonly processPaymentBenefits: ProcessPaymentBenefitsUseCase,
  ) {}

  async handle(event: PaymentCompletedEvent) {
    const { payload } = event;

    await this.processPaymentBenefits.execute({
      bookingId: payload.bookingId,
      userId: payload.userId,
      branchId: payload.branchId,
      amountCents: payload.amountCents,
      isOnline: payload.method === 'ONLINE',
    });
  }
}
