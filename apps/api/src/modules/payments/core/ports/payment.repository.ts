import { Payment } from '../entities/payment.entity';
import { PaymentItem } from '../entities/payment-item.entity';
import { CreatePaymentItem } from '../entities/payment-item.entity';
import { PaymentMethod } from 'src/modules/db/schema/payments/payment';

export type { PaymentMethod };

export interface PaymentsRepositoryPort {
  createPayment(payment: Partial<Payment>): Promise<Payment>;

  addItems(paymentId: string, items: CreatePaymentItem[]): Promise<void>;

  findById(paymentId: string): Promise<Payment | null>;

  findByBookingId(bookingId: string): Promise<Payment | null>;

  markPaid(
    paymentId: string,
    data: {
      paymentMethod: PaymentMethod;
      paidAt: Date;
    },
  );

  getItems(paymentId: string): Promise<PaymentItem[]>;

  removeItem(itemId: string): Promise<void>;

  cancelPayment(paymentId: string): Promise<void>;

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
