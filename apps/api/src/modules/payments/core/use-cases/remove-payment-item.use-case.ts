import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PAYMENTS_REPOSITORY } from '../ports/tokens';
import * as paymentRepository from '../ports/payment.repository';
import { RecalculatePaymentTotalsUseCase } from './recalculate-payment-totals.use-case';

@Injectable()
export class RemovePaymentItemUseCase {
  constructor(
    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepo: paymentRepository.PaymentsRepositoryPort,

    private readonly recalcTotals: RecalculatePaymentTotalsUseCase,
  ) {}

  async execute(paymentId: string, itemId: string) {
    const payment = await this.paymentsRepo.findById(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'pending') {
      throw new Error('Cannot modify finalized payment');
    }

    await this.paymentsRepo.removeItem(itemId);

    await this.recalcTotals.execute(paymentId);
  }
}
