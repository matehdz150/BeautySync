import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { payments, paymentItems } from 'src/modules/db/schema';
import type { DB } from 'src/modules/db/client';
import { CreatePaymentItem } from '../../core/entities/payment-item.entity';

@Injectable()
export class DrizzlePaymentsRepository {
  constructor(@Inject('DB') private readonly db: DB) {}

  async createPayment(data: typeof payments.$inferInsert) {
    const [payment] = await this.db.insert(payments).values(data).returning();

    return payment;
  }

  async addItems(paymentId: string, items: CreatePaymentItem[]) {
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

  async findById(paymentId: string) {
    const [payment] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId));

    return payment ?? null;
  }

  async markPaid(paymentId: string, paidAt: Date) {
    await this.db
      .update(payments)
      .set({
        status: 'paid',
        paidAt,
      })
      .where(eq(payments.id, paymentId));
  }

  async getItems(paymentId: string) {
    return this.db
      .select()
      .from(paymentItems)
      .where(eq(paymentItems.paymentId, paymentId));
  }

  async updateTotals(
    paymentId: string,
    totals: {
      subtotalCents: number;
      discountsCents: number;
      taxCents: number;
      totalCents: number;
    },
  ) {
    await this.db
      .update(payments)
      .set(totals)
      .where(eq(payments.id, paymentId));
  }
}
