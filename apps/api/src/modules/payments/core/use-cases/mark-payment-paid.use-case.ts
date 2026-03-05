import { Inject, Injectable } from '@nestjs/common';
import * as paymentRepository from '../ports/payment.repository';
import { PAYMENTS_REPOSITORY } from '../ports/tokens';

@Injectable()
export class MarkPaymentPaidUseCase {
  constructor(
    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepo: paymentRepository.PaymentsRepositoryPort,
  ) {}

  async execute(paymentId: string, method: paymentRepository.PaymentMethod) {
    await this.paymentsRepo.markPaid(paymentId, {
      paymentMethod: method,
      paidAt: new Date(),
    });
  }
}
