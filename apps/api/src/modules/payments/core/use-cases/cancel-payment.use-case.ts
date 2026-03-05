import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PAYMENTS_REPOSITORY } from '../ports/tokens';
import * as paymentRepository from '../ports/payment.repository';

@Injectable()
export class CancelPaymentUseCase {
  constructor(
    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepo: paymentRepository.PaymentsRepositoryPort,
  ) {}

  async execute(paymentId: string) {
    const payment = await this.paymentsRepo.findById(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    await this.paymentsRepo.cancelPayment(paymentId);

    return { success: true };
  }
}
