import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, and, or, isNull, gt } from 'drizzle-orm';

import {
  payments,
  paymentItems,
  PaymentMethod,
  giftCards,
  coupons,
} from 'src/modules/db/schema';
import type { DB } from 'src/modules/db/client';

import { PaymentsRepositoryPort } from '../../core/ports/payment.repository';
import {
  CreatePaymentItem,
  PaymentItem,
} from '../../core/entities/payment-item.entity';
import { Payment } from '../../core/entities/payment.entity';

@Injectable()
export class DrizzlePaymentsRepository implements PaymentsRepositoryPort {
  constructor(@Inject('DB') private readonly db: DB) {}

  /* =====================
     PAYMENT
  ===================== */

  async createPayment(payment: Partial<Payment>): Promise<Payment> {
    const [result] = await this.db
      .insert(payments)
      .values(payment as typeof payments.$inferInsert)
      .returning();

    return new Payment(
      result.id,
      result.organizationId,
      result.branchId,
      result.bookingId,
      result.clientId,
      result.cashierStaffId,
      result.status,
      result.subtotalCents,
      result.discountsCents,
      result.taxCents,
      result.totalCents,
      result.createdAt,
      result.paidAt,
      result.paymentMethod,
      result.paymentProvider,
      result.externalReference,
      result.notes,
    );
  }

  async findById(paymentId: string): Promise<Payment | null> {
    const [row] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId));

    if (!row) return null;

    return new Payment(
      row.id,
      row.organizationId,
      row.branchId,
      row.bookingId,
      row.clientId,
      row.cashierStaffId,
      row.status,
      row.subtotalCents,
      row.discountsCents,
      row.taxCents,
      row.totalCents,
      row.createdAt,
      row.paidAt,
      row.paymentMethod,
      row.paymentProvider,
      row.externalReference,
      row.notes,
    );
  }

  async markPaid(
    paymentId: string,
    data: {
      paymentMethod: PaymentMethod;
      paidAt: Date;
    },
  ) {
    await this.db
      .update(payments)
      .set({
        status: 'paid',
        paymentMethod: data.paymentMethod,
        paidAt: data.paidAt,
      })
      .where(eq(payments.id, paymentId));
  }

  async updateTotals(
    paymentId: string,
    totals: {
      subtotalCents: number;
      discountsCents: number;
      taxCents: number;
      totalCents: number;
    },
  ): Promise<void> {
    await this.db
      .update(payments)
      .set(totals)
      .where(eq(payments.id, paymentId));
  }

  /* =====================
     PAYMENT ITEMS
  ===================== */

  async addItems(paymentId: string, items: CreatePaymentItem[]): Promise<void> {
    const values: (typeof paymentItems.$inferInsert)[] = items.map((item) => ({
      paymentId,
      type: item.type,
      label: item.label,
      amountCents: item.amountCents,
      referenceId: item.referenceId ?? null,
      staffId: item.staffId ?? null,
      meta: item.meta ?? null,
    }));

    await this.db.insert(paymentItems).values(values);
  }

  async removeItem(itemId: string): Promise<void> {
    await this.db.delete(paymentItems).where(eq(paymentItems.id, itemId));
  }

  async getItems(paymentId: string): Promise<PaymentItem[]> {
    const rows = await this.db
      .select()
      .from(paymentItems)
      .where(eq(paymentItems.paymentId, paymentId));

    return rows.map(
      (row) =>
        new PaymentItem(
          row.id,
          row.paymentId,
          row.type,
          row.label,
          row.amountCents,
          row.referenceId ?? undefined,
          row.staffId ?? undefined,
          row.meta as Record<string, unknown> | undefined,
        ),
    );
  }

  async cancelPayment(paymentId: string): Promise<void> {
    await this.db
      .update(payments)
      .set({
        status: 'cancelled',
      })
      .where(eq(payments.id, paymentId));
  }

  async findByBookingId(bookingId: string): Promise<Payment | null> {
    const [row] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.bookingId, bookingId))
      .orderBy(desc(payments.createdAt)) // 🔥 clave
      .limit(1);

    if (!row) return null;

    return new Payment(
      row.id,
      row.organizationId,
      row.branchId,
      row.bookingId,
      row.clientId,
      row.cashierStaffId,
      row.status,
      row.subtotalCents,
      row.discountsCents,
      row.taxCents,
      row.totalCents,
      row.createdAt,
      row.paidAt,
      row.paymentMethod,
      row.paymentProvider,
      row.externalReference,
      row.notes,
    );
  }

  async assignClient(paymentId: string, clientId: string): Promise<void> {
    await this.db
      .update(payments)
      .set({
        clientId,
      })
      .where(eq(payments.id, paymentId));
  }

  async findByClientId(clientId: string): Promise<Payment[]> {
    const rows = await this.db
      .select()
      .from(payments)
      .where(eq(payments.clientId, clientId))
      .orderBy(desc(payments.createdAt));

    return rows.map(
      (row) =>
        new Payment(
          row.id,
          row.organizationId,
          row.branchId,
          row.bookingId,
          row.clientId,
          row.cashierStaffId,
          row.status,
          row.subtotalCents,
          row.discountsCents,
          row.taxCents,
          row.totalCents,
          row.createdAt,
          row.paidAt,
          row.paymentMethod,
          row.paymentProvider,
          row.externalReference,
          row.notes,
        ),
    );
  }

  async getAvailableBenefits(input: {
    branchId: string;
    publicUserId: string;
  }) {
    const now = new Date();

    // =========================
    // 🎁 GIFT CARDS
    // =========================
    const giftCardsRows = await this.db
      .select({
        id: giftCards.id,
        code: giftCards.code,
        balanceCents: giftCards.balanceCents,
        expiresAt: giftCards.expiresAt,
      })
      .from(giftCards)
      .where(
        and(
          eq(giftCards.branchId, input.branchId),
          eq(giftCards.ownerUserId, input.publicUserId),
          eq(giftCards.status, 'active'),
          gt(giftCards.balanceCents, 0),

          // 🔥 no expiradas
          or(isNull(giftCards.expiresAt), gt(giftCards.expiresAt, now)),
        ),
      );

    // =========================
    // 🎟 COUPONS
    // =========================
    const couponsRows = await this.db
      .select({
        id: coupons.id,
        code: coupons.code,
        type: coupons.type,
        value: coupons.value,
        expiresAt: coupons.expiresAt,
      })
      .from(coupons)
      .where(
        and(
          eq(coupons.branchId, input.branchId),
          eq(coupons.isActive, true),

          // 🔥 solo asignados a user (puedes expandir luego)
          eq(coupons.assignedToUserId, input.publicUserId),

          // 🔥 no expirados
          or(isNull(coupons.expiresAt), gt(coupons.expiresAt, now)),
        ),
      );

    return {
      giftCards: giftCardsRows,
      coupons: couponsRows,
    };
  }

  async getUserBenefitBranchIds(userId: string) {
    const giftCardBranches = await this.db
      .select({ branchId: giftCards.branchId })
      .from(giftCards)
      .where(eq(giftCards.ownerUserId, userId));

    const couponBranches = await this.db
      .select({ branchId: coupons.branchId })
      .from(coupons)
      .where(eq(coupons.assignedToUserId, userId));

    return [
      ...new Set([
        ...giftCardBranches.map((g) => g.branchId),
        ...couponBranches.map((c) => c.branchId),
      ]),
    ];
  }
}
