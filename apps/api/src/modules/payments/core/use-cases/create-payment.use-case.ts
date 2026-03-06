import { Inject, Injectable } from '@nestjs/common';
import { PAYMENTS_REPOSITORY } from '../ports/tokens';
import * as paymentRepository from '../ports/payment.repository';
import { PaymentMethod } from '../ports/payment.repository';

@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepo: paymentRepository.PaymentsRepositoryPort,
  ) {}

  async execute(data: {
    organizationId: string;
    branchId: string;
    bookingId?: string;
    clientId?: string;
    cashierStaffId: string;
    paymentMethod?: string;
    paymentProvider?: string;
    externalReference?: string;
    notes?: string;
  }) {
    const payment = await this.paymentsRepo.createPayment({
      ...data,
      paymentMethod: data.paymentMethod as PaymentMethod,
      status: 'pending',
      subtotalCents: 0,
      discountsCents: 0,
      taxCents: 0,
      totalCents: 0,
    });

    return payment;
  }
}
