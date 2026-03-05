import { Payment } from '../entities/payment.entity';
import { PaymentItem } from '../entities/payment-item.entity';
import { CreatePaymentItem } from '../entities/payment-item.entity';

export interface PaymentsRepositoryPort {
  createPayment(payment: Partial<Payment>): Promise<Payment>;

  addItems(paymentId: string, items: CreatePaymentItem[]): Promise<void>;

  findById(paymentId: string): Promise<Payment | null>;

  markPaid(paymentId: string, paidAt: Date): Promise<void>;

  getItems(paymentId: string): Promise<PaymentItem[]>;

  updateTotals(
    paymentId: string,
    totals: {
      subtotalCents: number;
      discountsCents: number;
      taxCents: number;
      totalCents: number;
    },
  ): Promise<void>;
}
