import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, and, or, isNull, gt, inArray, sql } from 'drizzle-orm';

import {
  payments,
  paymentItems,
  PaymentMethod,
  giftCards,
  coupons,
  couponServices,
  services,
  benefitUserBalance,
  benefitPrograms,
  benefitRewards,
  benefitTiers,
  benefitTierRewards,
  userTierState,
  userTierRewardsGranted,
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
    const nowIso = now.toISOString();
    const summaryRows = await this.db
      .select({
        programId: benefitPrograms.id,
        pointsBalance: benefitUserBalance.pointsBalance,
        tierId: benefitTiers.id,
        tierName: benefitTiers.name,
        tierColor: benefitTiers.color,
        tierIcon: benefitTiers.icon,
      })
      .from(benefitPrograms)
      .leftJoin(
        benefitUserBalance,
        and(
          eq(benefitUserBalance.branchId, input.branchId),
          eq(benefitUserBalance.userId, input.publicUserId),
        ),
      )
      .leftJoin(
        userTierState,
        and(
          eq(userTierState.branchId, input.branchId),
          eq(userTierState.userId, input.publicUserId),
        ),
      )
      .leftJoin(benefitTiers, eq(benefitTiers.id, userTierState.currentTierId))
      .where(
        and(
          eq(benefitPrograms.branchId, input.branchId),
          eq(benefitPrograms.isActive, true),
        ),
      )
      .limit(1);

    const summary = summaryRows[0];
    const programId = summary?.programId ?? null;
    const pointsBalance = summary?.pointsBalance ?? 0;
    const hasActiveProgram = !!programId;

    let redeemableRewards: {
      availableCount: number;
      rewards: {
        id: string;
        name: string;
        pointsCost: number;
        type: 'SERVICE' | 'PRODUCT' | 'COUPON' | 'GIFT_CARD' | 'CUSTOM';
        referenceId?: string | null;
        config?: Record<string, unknown>;
      }[];
    } = {
      availableCount: 0,
      rewards: [],
    };

    let tier: {
      id: string;
      name: string;
      color: string | null;
      icon: string | null;
    } | null = summary?.tierId
      ? {
          id: summary.tierId,
          name: summary.tierName ?? '',
          color: summary.tierColor ?? null,
          icon: summary.tierIcon ?? null,
        }
      : null;

    if (programId) {
      const rewards = await this.db
        .select({
          id: benefitRewards.id,
          name: benefitRewards.name,
          pointsCost: benefitRewards.pointsCost,
          type: benefitRewards.type,
          referenceId: benefitRewards.referenceId,
          config: benefitRewards.config,
          stock: benefitRewards.stock,
        })
        .from(benefitRewards)
        .where(
          and(
            eq(benefitRewards.programId, programId),
            eq(benefitRewards.isActive, true),
            or(isNull(benefitRewards.stock), gt(benefitRewards.stock, 0)),
          ),
        );

      const affordable = rewards.filter((r) => pointsBalance >= r.pointsCost);

      redeemableRewards = {
        availableCount: affordable.length,
        rewards: affordable.map((r) => ({
          id: r.id,
          name: r.name,
          pointsCost: r.pointsCost,
          type: r.type,
          referenceId: r.referenceId ?? null,
          config:
            r.config && typeof r.config === 'object'
              ? (r.config as Record<string, unknown>)
              : undefined,
        })),
      };
    }

    const couponsRows = await this.db
      .select({
        couponId: coupons.id,
        code: coupons.code,
        type: coupons.type,
        value: coupons.value,
        expiresAt: coupons.expiresAt,
        serviceName: services.name,
      })
      .from(coupons)
      .leftJoin(couponServices, eq(couponServices.couponId, coupons.id))
      .leftJoin(services, eq(services.id, couponServices.serviceId))
      .where(
        and(
          eq(coupons.branchId, input.branchId),
          eq(coupons.isActive, true),
          eq(coupons.assignedToUserId, input.publicUserId),
          or(isNull(coupons.expiresAt), gt(coupons.expiresAt, now)),
        ),
      );

    const couponsMap = new Map<
      string,
      {
        id: string;
        code: string;
        type: 'percentage' | 'fixed';
        value: number;
        expiresAt: Date | null;
        serviceNames: string[];
      }
    >();

    for (const row of couponsRows) {
      const current = couponsMap.get(row.couponId) ?? {
        id: row.couponId,
        code: row.code,
        type: row.type,
        value: row.value,
        expiresAt: row.expiresAt ?? null,
        serviceNames: [],
      };

      if (row.serviceName) {
        current.serviceNames.push(row.serviceName);
      }

      couponsMap.set(row.couponId, current);
    }

    const giftCardsRows = await this.db.execute(sql`
      SELECT
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', gc.id,
              'code', gc.code,
              'balanceCents', gc.balance_cents,
              'expiresAt', gc.expires_at
            )
          )
          FROM gift_cards gc
          WHERE gc.branch_id = ${input.branchId}
            AND gc.owner_user_id = ${input.publicUserId}
            AND gc.status = 'active'
            AND gc.balance_cents > 0
            AND (gc.expires_at IS NULL OR gc.expires_at > ${nowIso})
        ), '[]'::json) AS gift_cards
    `);

    const giftCardsPayload = (giftCardsRows as unknown as Array<{
      gift_cards: Array<{
        id: string;
        code: string;
        balanceCents: number;
        expiresAt: Date | null;
      }>;
    }>)[0] ?? { gift_cards: [] };

    const tierRewardsRows = tier?.id
      ? await this.db.execute(sql`
          SELECT COALESCE((
            SELECT json_agg(
              json_build_object(
                'id', btr.id,
                'type', btr.type,
                'config', btr.config,
                'granted', CASE
                  WHEN btr.type = 'RECURRING' THEN true
                  ELSE utrg.tier_reward_id IS NOT NULL
                END,
                'grantedAt', utrg.granted_at,
                'used', false
              )
            )
            FROM benefit_tier_rewards btr
            LEFT JOIN user_tier_rewards_granted utrg
              ON utrg.tier_reward_id = btr.id
             AND utrg.user_id = ${input.publicUserId}
             AND utrg.branch_id = ${input.branchId}
            WHERE btr.tier_id = ${tier.id}
          ), '[]'::json) AS tier_rewards
        `)
      : [{ tier_rewards: [] }];

    const tierRewardsPayload = (tierRewardsRows as unknown as Array<{
      tier_rewards: {
        id: string;
        type: 'ONE_TIME' | 'RECURRING';
        config: Record<string, unknown>;
        granted: boolean;
        grantedAt: Date | null;
        used: boolean;
      }[];
    }>)[0] ?? { tier_rewards: [] };

    return {
      hasActiveProgram,
      giftCards: giftCardsPayload.gift_cards ?? [],
      coupons: Array.from(couponsMap.values()).map((coupon) => ({
        ...coupon,
        serviceName: coupon.serviceNames[0] ?? null,
      })),
      pointsBalance,
      redeemableRewards,
      tier,
      tierRewards: tierRewardsPayload.tier_rewards ?? [],
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
