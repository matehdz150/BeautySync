import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';

import { payments, paymentItems, PaymentMethod } from 'src/modules/db/schema';
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

    return result;
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
    );
  }
}
