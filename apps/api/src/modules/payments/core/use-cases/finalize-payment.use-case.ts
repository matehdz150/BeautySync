import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PAYMENTS_REPOSITORY } from '../ports/tokens';
import * as paymentRepository from '../ports/payment.repository';

import { RecalculatePaymentTotalsUseCase } from './recalculate-payment-totals.use-case';

@Injectable()
export class FinalizePaymentUseCase {
  constructor(
    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepo: paymentRepository.PaymentsRepositoryPort,

    private readonly recalcTotals: RecalculatePaymentTotalsUseCase,
  ) {}

  async execute(paymentId: string, method: paymentRepository.PaymentMethod) {
    const payment = await this.paymentsRepo.findById(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    /* =====================
       STATUS VALIDATION
    ===================== */

    if (payment.status === 'paid') {
      return payment;
    }

    if (payment.status !== 'pending') {
      throw new BadRequestException('Payment cannot be finalized');
    }

    /* =====================
       ITEMS VALIDATION
    ===================== */

    const items = await this.paymentsRepo.getItems(paymentId);

    if (!items.length) {
      throw new BadRequestException('Cannot finalize empty payment');
    }

    /* =====================
       RECALC TOTALS
    ===================== */

    await this.recalcTotals.execute(paymentId);

    /* =====================
       MARK PAID
    ===================== */

    await this.paymentsRepo.markPaid(paymentId, {
      paymentMethod: method,
      paidAt: new Date(),
    });

    return this.paymentsRepo.findById(paymentId);
  }
}
