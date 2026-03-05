import { Inject, Injectable } from '@nestjs/common';
import { PAYMENTS_REPOSITORY } from '../ports/tokens';
import * as paymentRepository from '../ports/payment.repository';

@Injectable()
export class OpenPaymentUseCase {
  constructor(
    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepo: paymentRepository.PaymentsRepositoryPort,
  ) {}

  async execute(data: {
    organizationId: string;
    branchId: string;
    cashierStaffId: string;
    clientId?: string;
  }) {
    const payment = await this.paymentsRepo.createPayment({
      organizationId: data.organizationId,
      branchId: data.branchId,
      cashierStaffId: data.cashierStaffId,
      clientId: data.clientId ?? null,
      bookingId: null,

      status: 'pending',

      subtotalCents: 0,
      discountsCents: 0,
      taxCents: 0,
      totalCents: 0,
    });

    return payment;
  }
}
