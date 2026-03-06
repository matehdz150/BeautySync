import { PaymentMethod } from '../ports/payment.repository';
import { PaymentItem } from './payment-item.entity';

export class Payment {
  constructor(
    public id: string,
    public organizationId: string,
    public branchId: string,
    public bookingId: string | null,
    public clientId: string | null,
    public cashierStaffId: string,

    public status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled',

    public subtotalCents: number,
    public discountsCents: number,
    public taxCents: number,
    public totalCents: number,

    public createdAt: Date,
    public paidAt?: Date | null,

    public paymentMethod?: PaymentMethod | null,
    public paymentProvider?: string | null,
    public externalReference?: string | null,
    public notes?: string | null,
  ) {}
}

export type ClientPaymentDetails = {
  payment: Payment;
  items: PaymentItem[];
  booking?: { id: string } | null;
};
