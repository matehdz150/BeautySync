import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaymentItem } from '../entities/payment-item.entity';
import { PAYMENTS_REPOSITORY } from '../ports/tokens';
import * as paymentRepository from '../ports/payment.repository';
import { RecalculatePaymentTotalsUseCase } from './recalculate-payment-totals.use-case';

@Injectable()
export class AddPaymentItemUseCase {
  constructor(
    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepo: paymentRepository.PaymentsRepositoryPort,

    private readonly recalcTotals: RecalculatePaymentTotalsUseCase,
  ) {}

  async execute(paymentId: string, items: CreatePaymentItem[]) {
    const payment = await this.paymentsRepo.findById(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'pending') {
      throw new Error('Cannot modify finalized payment');
    }

    await this.paymentsRepo.addItems(paymentId, items);

    await this.recalcTotals.execute(paymentId);

    return this.paymentsRepo.findById(paymentId);
  }
}
