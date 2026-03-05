import { Inject, Injectable } from '@nestjs/common';
import * as paymentRepository from '../ports/payment.repository';
import { PaymentItem } from '../entities/payment-item.entity';
import { PAYMENTS_REPOSITORY } from '../ports/tokens';

@Injectable()
export class RecalculatePaymentTotalsUseCase {
  constructor(
    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepo: paymentRepository.PaymentsRepositoryPort,
  ) {}

  async execute(paymentId: string) {
    const items = await this.paymentsRepo.getItems(paymentId);

    let subtotal = 0;
    let discounts = 0;
    let tax = 0;

    for (const item of items) {
      if (item.type === 'discount') {
        discounts += Math.abs(item.amountCents);
      } else if (item.type === 'tax') {
        tax += item.amountCents;
      } else {
        subtotal += item.amountCents;
      }
    }

    const total = subtotal - discounts + tax;

    await this.paymentsRepo.updateTotals(paymentId, {
      subtotalCents: subtotal,
      discountsCents: discounts,
      taxCents: tax,
      totalCents: total,
    });

    return {
      subtotal,
      discounts,
      tax,
      total,
    };
  }
}
