import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as client from 'src/modules/db/client';

import {
  CreateGiftCardInput,
  GiftCardRepository,
} from '../../core/ports/gift-card.repository';

import { eq } from 'drizzle-orm';

import { giftCards } from 'src/modules/db/schema/gift-cards/gift-card';
import { giftCardTransactions } from 'src/modules/db/schema/gift-cards/gift-card-transactions';
import { GiftCard } from '../../core/entities/gift-card.entity';
import { GiftCardTransaction } from '../../core/entities/gift-card-transaction.entity';

type GiftCardRow = typeof giftCards.$inferSelect;
type GiftCardTransactionRow = typeof giftCardTransactions.$inferSelect;

@Injectable()
export class DrizzleGiftCardRepository implements GiftCardRepository {
  constructor(@Inject('DB') private db: client.DB) {}

  // =========================
  // 🔥 NORMALIZER (NO MAPPER FORMAL)
  // =========================
  private toGiftCard(row: GiftCardRow): GiftCard {
    return new GiftCard(
      row.id,
      row.branchId,
      row.code,
      row.initialAmountCents,
      row.balanceCents,
      row.currency ?? 'MXN',
      row.status ?? 'active',
      row.ownerUserId ?? null,
      row.expiresAt ?? null,
      row.createdAt ?? new Date(),
      row.updatedAt ?? new Date(),
    );
  }

  private toTransaction(row: GiftCardTransactionRow): GiftCardTransaction {
    return new GiftCardTransaction(
      row.id,
      row.giftCardId,
      row.type,
      row.amountCents,
      row.referenceType ?? null,
      row.referenceId ?? null,
      row.note ?? null,
      row.createdAt ?? new Date(),
    );
  }

  // =========================
  // CREATE
  // =========================
  async create(data: CreateGiftCardInput): Promise<GiftCard> {
    const [created] = await this.db
      .insert(giftCards)
      .values({
        branchId: data.branchId,
        code: data.code,
        initialAmountCents: data.initialAmountCents,
        balanceCents: data.initialAmountCents,
        currency: data.currency ?? 'MXN',
        status: 'active',
        expiresAt: data.expiresAt ?? null,
        ownerUserId: data.ownerUserId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!created) {
      throw new BadRequestException('Could not create gift card');
    }

    return this.toGiftCard(created);
  }

  // =========================
  // FIND
  // =========================
  async findById(id: string): Promise<GiftCard | null> {
    const row = await this.db.query.giftCards.findFirst({
      where: eq(giftCards.id, id),
    });

    return row ? this.toGiftCard(row) : null;
  }

  async findByCode(code: string): Promise<GiftCard | null> {
    const row = await this.db.query.giftCards.findFirst({
      where: eq(giftCards.code, code),
    });

    return row ? this.toGiftCard(row) : null;
  }

  async findByBranch(branchId: string): Promise<GiftCard[]> {
    const rows = await this.db.query.giftCards.findMany({
      where: eq(giftCards.branchId, branchId),
      orderBy: (gc, { desc }) => [desc(gc.createdAt)],
    });

    return rows.map((r) => this.toGiftCard(r));
  }

  async findByUser(userId: string): Promise<GiftCard[]> {
    const rows = await this.db.query.giftCards.findMany({
      where: eq(giftCards.ownerUserId, userId),
      orderBy: (gc, { desc }) => [desc(gc.createdAt)],
    });

    return rows.map((r) => this.toGiftCard(r));
  }

  // =========================
  // UPDATE BALANCE
  // =========================
  async updateBalance(
    id: string,
    newBalanceCents: number,
    status?: GiftCard['status'],
  ): Promise<void> {
    await this.db
      .update(giftCards)
      .set({
        balanceCents: newBalanceCents,
        status,
        updatedAt: new Date(),
      })
      .where(eq(giftCards.id, id));
  }

  // =========================
  // UPDATE (assign/unassign)
  // =========================
  async update(
    id: string,
    data: {
      ownerUserId?: string | null;
      note?: string | null;
      status?: GiftCard['status'];
    },
  ): Promise<GiftCard> {
    const [updated] = await this.db
      .update(giftCards)
      .set({
        ownerUserId: data.ownerUserId,
        note: data.note,
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(giftCards.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException('Gift card not found');
    }

    return this.toGiftCard(updated);
  }

  // =========================
  // TRANSACTIONS
  // =========================
  async createTransaction(data: {
    giftCardId: string;
    type: GiftCardTransaction['type'];
    amountCents: number;
    referenceType?: string;
    referenceId?: string;
    note?: string;
  }): Promise<GiftCardTransaction> {
    const [created] = await this.db
      .insert(giftCardTransactions)
      .values({
        giftCardId: data.giftCardId,
        type: data.type,
        amountCents: data.amountCents,
        referenceType:
          (data.referenceType as 'booking' | 'order' | 'manual') ?? 'manual',
        referenceId: data.referenceId ?? null,
        note: data.note ?? null,
        createdAt: new Date(),
      })
      .returning();

    if (!created) {
      throw new BadRequestException('Could not create transaction');
    }

    return this.toTransaction(created);
  }

  async findTransactions(giftCardId: string): Promise<GiftCardTransaction[]> {
    const rows = await this.db.query.giftCardTransactions.findMany({
      where: eq(giftCardTransactions.giftCardId, giftCardId),
      orderBy: (tx, { desc }) => [desc(tx.createdAt)],
    });

    return rows.map((r) => this.toTransaction(r));
  }

  // =========================
  // REDEEM (NO TOCAR)
  // =========================
  async redeem(input: { code: string; amountCents: number; branchId: string }) {
    return this.db.transaction(async (tx) => {
      const giftCard = await tx.query.giftCards.findFirst({
        where: eq(giftCards.code, input.code),
      });

      if (!giftCard) {
        throw new NotFoundException('Gift card not found');
      }

      if (giftCard.balanceCents < input.amountCents) {
        throw new BadRequestException('Insufficient balance');
      }

      const newBalance = giftCard.balanceCents - input.amountCents;

      await tx
        .update(giftCards)
        .set({
          balanceCents: newBalance,
          updatedAt: new Date(),
        })
        .where(eq(giftCards.id, giftCard.id));

      await tx.insert(giftCardTransactions).values({
        giftCardId: giftCard.id,
        type: 'redeem',
        amountCents: input.amountCents,
        referenceType: 'manual',
        createdAt: new Date(),
      });

      return {
        remainingBalance: newBalance,
      };
    });
  }
}
