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

  assignClient(paymentId: string, clientId: string): Promise<void>;

  findByClientId(clientId: string): Promise<Payment[]>;

  getAvailableBenefits(input: {
    branchId: string;
    publicUserId: string;
  }): Promise<{
    hasActiveProgram: boolean;
    giftCards: {
      id: string;
      code: string;
      balanceCents: number;
      expiresAt?: Date | null;
    }[];
    coupons: {
      id: string;
      code: string;
      type: 'percentage' | 'fixed';
      value: number;
      expiresAt?: Date | null;
    }[];

    // 🔥 beneficios ampliados
    pointsBalance: number;

    redeemableRewards: {
      availableCount: number;
      rewards: {
        id: string;
        name: string;
        pointsCost: number;
        type: 'SERVICE' | 'PRODUCT' | 'COUPON' | 'GIFT_CARD' | 'CUSTOM';
        referenceId?: string | null;
        config?: Record<string, unknown>;
      }[];
    };

    tier: {
      id: string;
      name: string;
      color: string | null;
      icon: string | null;
    } | null;

    tierRewards: {
      id: string;
      type: 'ONE_TIME' | 'RECURRING';
      config: Record<string, unknown>;
      granted: boolean;
      grantedAt: Date | null;
      used: boolean;
    }[];
  }>;

  getUserBenefitBranchIds(userId: string): Promise<string[]>;
}
